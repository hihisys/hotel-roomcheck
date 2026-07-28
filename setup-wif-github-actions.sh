#!/bin/bash

# GitHub Actions와 Google Cloud WIF 자동 설정 스크립트
# macOS에서 사용하도록 설계됨

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}GitHub Actions + Google Cloud WIF 설정${NC}"
echo -e "${GREEN}========================================${NC}\n"

# 환경 변수 설정
export GCP_PROJECT_ID="hotel-roomcheck"
export GCP_REGION="us-central1"
export POOL_NAME="github-pool"
export PROVIDER_NAME="github"
export SERVICE_ACCOUNT="github-deploy@hotel-roomcheck.iam.gserviceaccount.com"
export GITHUB_OWNER="hihisys"
export GITHUB_REPO="hotel-roomcheck"

# 필수 도구 확인
echo -e "${YELLOW}필수 도구 확인 중...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI가 설치되지 않았습니다.${NC}"
    echo "설치 방법: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo -e "${GREEN}✅ gcloud 설치됨${NC}"

if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI가 설치되지 않았습니다.${NC}"
    echo "설치 방법: https://cli.github.com"
    exit 1
fi
echo -e "${GREEN}✅ gh 설치됨${NC}\n"

# Google Cloud 프로젝트 설정 확인
echo -e "${YELLOW}Google Cloud 프로젝트 설정 확인 중...${NC}"

CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$GCP_PROJECT_ID" ]; then
    echo -e "${YELLOW}현재 프로젝트: $CURRENT_PROJECT${NC}"
    read -p "프로젝트를 $GCP_PROJECT_ID로 변경하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud config set project $GCP_PROJECT_ID
    else
        echo -e "${RED}설정 취소됨${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Google Cloud 프로젝트: $GCP_PROJECT_ID${NC}\n"

# Google Cloud 로그인 확인
echo -e "${YELLOW}Google Cloud 인증 확인 중...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}Google Cloud에 로그인해야 합니다...${NC}"
    gcloud auth login
fi
echo -e "${GREEN}✅ Google Cloud 인증됨${NC}\n"

# WIF 공급업체 생성
echo -e "${YELLOW}WIF OIDC 공급업체 생성 중...${NC}"

if gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
    --project="$GCP_PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="$POOL_NAME" &>/dev/null; then
    echo -e "${GREEN}✅ WIF 공급업체가 이미 존재합니다.${NC}"
else
    echo "새로운 OIDC 공급업체를 생성하는 중..."
    gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
        --project="$GCP_PROJECT_ID" \
        --location="global" \
        --workload-identity-pool="$POOL_NAME" \
        --display-name="GitHub" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.aud=assertion.aud,attribute.repository=assertion.repository" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-condition="assertion.repository == '${GITHUB_OWNER}/${GITHUB_REPO}'"
    echo -e "${GREEN}✅ WIF OIDC 공급업체 생성됨${NC}"
fi

# WIF 공급업체 리소스 이름 가져오기
echo -e "${YELLOW}WIF 공급업체 리소스 이름 확인 중...${NC}"
WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
    --project="$GCP_PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="$POOL_NAME" \
    --format='value(name)')

if [ -z "$WORKLOAD_IDENTITY_PROVIDER" ]; then
    echo -e "${RED}❌ WIF 공급업체 리소스 이름을 가져올 수 없습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ WIF_PROVIDER: $WORKLOAD_IDENTITY_PROVIDER${NC}\n"

# 서비스 계정에 IAM 역할 부여
echo -e "${YELLOW}서비스 계정에 IAM 역할 부여 중...${NC}"

# 먼저 프로젝트 번호 가져오기
PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
    --project="$GCP_PROJECT_ID" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPO}" \
    --condition=None

echo -e "${GREEN}✅ IAM 역할 부여됨${NC}\n"

# GitHub Secret 추가
echo -e "${YELLOW}GitHub Secret 추가 중...${NC}"

# GitHub CLI 인증 확인
if ! gh auth status &>/dev/null; then
    echo -e "${YELLOW}GitHub CLI 인증이 필요합니다...${NC}"
    gh auth login
fi

# WIF_PROVIDER Secret 추가
if gh secret set WIF_PROVIDER --body "$WORKLOAD_IDENTITY_PROVIDER" \
    -R $GITHUB_OWNER/$GITHUB_REPO 2>/dev/null; then
    echo -e "${GREEN}✅ WIF_PROVIDER Secret 추가됨${NC}"
else
    echo -e "${YELLOW}⚠️  WIF_PROVIDER Secret이 이미 존재합니다. (업데이트됨)${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}설정 완료!${NC}"
echo -e "${GREEN}========================================${NC}\n"

# 최종 확인
echo -e "${YELLOW}GitHub Secrets 확인 중...${NC}"
echo -e "${GREEN}현재 설정된 Secrets:${NC}"
gh secret list -R $GITHUB_OWNER/$GITHUB_REPO

echo -e "\n${GREEN}다음 단계:${NC}"
echo "1. 코드 변경사항을 git에 커밋하세요"
echo "2. main 브랜치에 push하세요: git push origin main"
echo "3. GitHub Actions 탭에서 배포 상태를 확인하세요"
echo ""
echo -e "${GREEN}설정이 완료되었습니다!${NC}\n"

exit 0
