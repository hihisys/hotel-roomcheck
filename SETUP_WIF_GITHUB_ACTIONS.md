# GitHub Actions와 Google Cloud WIF 설정 가이드

이 문서는 Google Cloud Workload Identity Federation(WIF)을 GitHub Actions와 통합하기 위한 설정 절차를 설명합니다.

## 현재 상태

✅ 완료됨:
- Google Cloud 프로젝트: `hotel-roomcheck`
- WIF 풀: `github-pool` (생성됨)
- 서비스 계정: `github-deploy@hotel-roomcheck.iam.gserviceaccount.com` (생성됨)
- GitHub Secrets:
  - `GCP_PROJECT_ID`: hotel-roomcheck ✅
  - `WIF_SERVICE_ACCOUNT`: github-deploy@hotel-roomcheck.iam.gserviceaccount.com ✅
  - `WIF_PROVIDER`: 설정됨 ✅

✅ 배포 완료:
- WIF OIDC 공급업체 생성 ✅
- 서비스 계정 IAM 역할 부여 ✅
- GitHub Secrets 설정 ✅
- Cloud Run 배포 성공 ✅

## macOS에서 설정 방법

### 필수 조건

1. Google Cloud CLI (`gcloud`) 설치
2. GitHub CLI (`gh`) 설치 (선택사항, 자동 설정 시)
3. Google Cloud 프로젝트에 대한 적절한 IAM 권한
4. GitHub 저장소의 관리자 권한

### 단계 1: 환경 변수 설정

```bash
# Google Cloud 프로젝트 설정
export GCP_PROJECT_ID="hotel-roomcheck"
export GCP_REGION="us-central1"
export POOL_NAME="github-pool"
export PROVIDER_NAME="github"
export SERVICE_ACCOUNT="github-deploy@hotel-roomcheck.iam.gserviceaccount.com"

# GitHub 저장소 설정
export GITHUB_OWNER="hihisys"
export GITHUB_REPO="hotel-roomcheck"
```

### 단계 2: Google Cloud 로그인

```bash
gcloud auth login
gcloud config set project $GCP_PROJECT_ID
```

### 단계 3: GitHub OIDC 공급업체 생성

```bash
# OIDC 공급업체 생성
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
  --project="$GCP_PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.aud=assertion.aud,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-condition="assertion.repository == '${GITHUB_OWNER}/${GITHUB_REPO}'"
```

### 단계 4: WIF 공급업체 리소스 이름 확인

```bash
# WIF 공급업체의 리소스 이름 가져오기
WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe $PROVIDER_NAME \
  --project="$GCP_PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_NAME" \
  --format='value(name)')

echo "WIF_PROVIDER: $WORKLOAD_IDENTITY_PROVIDER"
```

이 명령어의 출력은 다음과 같습니다:
```
WIF_PROVIDER: projects/{PROJECT_NUMBER}/locations/global/workloadIdpools/github-pool/providers/github
```

### 단계 5: 서비스 계정에 IAM 역할 부여

```bash
# 프로젝트 번호 가져오기
PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')

# Cloud Run 배포 권한 부여
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --project="$GCP_PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPO}" \
  --condition=None
```

### 단계 6: GitHub Secret 추가

위에서 얻은 `WIF_PROVIDER` 값을 GitHub에 추가합니다.

#### 옵션 A: GitHub CLI 사용 (자동)

```bash
gh secret set WIF_PROVIDER --body "$WORKLOAD_IDENTITY_PROVIDER" \
  -R $GITHUB_OWNER/$GITHUB_REPO
```

#### 옵션 B: 수동으로 추가

1. GitHub 저장소로 이동
2. Settings → Secrets and variables → Actions
3. "New repository secret" 클릭
4. Name: `WIF_PROVIDER`
5. Secret: 위에서 출력된 리소스 이름 입력
6. "Add secret" 클릭

## 확인

모든 GitHub Secrets이 설정되었는지 확인:

```bash
gh secret list -R $GITHUB_OWNER/$GITHUB_REPO
```

다음 secrets이 표시되어야 합니다:
- `GCP_PROJECT_ID`
- `WIF_SERVICE_ACCOUNT`
- `WIF_PROVIDER`

## GitHub Actions 워크플로우 테스트

모든 설정이 완료되면, 코드를 main 브랜치에 push하면 GitHub Actions가 자동으로 실행됩니다.

```bash
git push origin main
```

## 문제 해결

### 에러: "WIF provider not found"

- WIF 공급업체가 생성되지 않았습니다
- 단계 3을 다시 실행하세요

### 에러: "Permission denied"

- 서비스 계정에 Cloud Run 배포 권한이 없습니다
- 단계 5를 다시 실행하세요

### 에러: "GitHub OIDC 토큰 검증 실패"

- attribute_condition이 일치하지 않습니다
- `assertion.repository` 값이 `{OWNER}/{REPO}` 형식인지 확인하세요

## 자동 설정 스크립트

모든 단계를 자동으로 실행하는 스크립트가 준비되어 있습니다:

```bash
# 저장소로 이동
cd ~/너바나\ 프로젝트/호텔\ 룸첵

# 자동 설정 실행
bash claude/setup-wif-github-actions.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
- 필수 도구 확인
- Google Cloud 인증 확인
- WIF OIDC 공급업체 생성
- IAM 역할 부여
- GitHub Secret 추가

## 참고 자료

- [Google Cloud Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions를 통한 Google Cloud 인증](https://github.com/google-github-actions/auth)
- [Google Cloud Run 배포](https://cloud.google.com/run/docs/deploying)
