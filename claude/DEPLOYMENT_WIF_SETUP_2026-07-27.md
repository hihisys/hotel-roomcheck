# Google Cloud WIF + GitHub Actions 배포 설정 현황
**작성일**: 2026년 7월 27일

## 📋 설정 요약

호텔 룸첵 사이트의 자동 배포를 위해 Google Cloud Run + GitHub Actions + Workload Identity Federation 설정을 진행 중입니다.

## ✅ 완료된 작업

### 1. Google Cloud 프로젝트 설정
- **프로젝트**: hotel-roomcheck
- **프로젝트 번호**: 356950571433
- **리전**: us-central1

### 2. 서비스 계정 생성
- **이름**: github-deploy
- **이메일**: github-deploy@hotel-roomcheck.iam.gserviceaccount.com
- **상태**: 활성

### 3. Workload Identity Federation 풀 생성
- **풀 이름**: github-pool
- **리소스 이름**: projects/356950571433/locations/global/workloadIdpools/github-pool
- **설명**: GitHub Actions CI/CD deployment for hotel-roomcheck
- **상태**: 활성

### 4. GitHub 저장소 설정
- **저장소**: hihisys/hotel-roomcheck
- **코드**: main 브랜치에 push됨
- **워크플로우**: .github/workflows/deploy-to-cloud-run.yml (생성됨)
- **상태**: 배포 대기 중

### 5. GitHub Secrets 설정
| Secret 이름 | 값 | 상태 |
|-------------|-----|------|
| GCP_PROJECT_ID | hotel-roomcheck | ✅ 설정됨 |
| WIF_SERVICE_ACCOUNT | github-deploy@hotel-roomcheck.iam.gserviceaccount.com | ✅ 설정됨 |
| WIF_PROVIDER | (아래 참조) | ⏳ 필요 |

### 6. Docker 설정
- **Dockerfile**: PHP 8.4-Apache 기반
- **이미지**: Google Container Registry (GCR)에 배포
- **포트**: 8080
- **메모리**: 512Mi
- **상태**: 준비됨

### 7. 조직 정책 확인
- **JSON 키 생성 정책**: 비활성화됨 (iam.managed.disableServiceAccountApiKeyCreation)
- **해결방법**: WIF를 사용하여 JSON 키 없이 안전한 인증 구현

## ⏳ 진행 중인 작업

### WIF OIDC 공급업체 생성
**상태**: 필요 (사용자의 로컬 Mac에서 gcloud CLI로 실행 필요)

**필요한 정보**:
- GCP_PROJECT_ID: hotel-roomcheck
- POOL_NAME: github-pool
- PROVIDER_NAME: github
- GITHUB_OWNER: hihisys
- GITHUB_REPO: hotel-roomcheck

**예상 리소스 이름**:
```
projects/356950571433/locations/global/workloadIdpools/github-pool/providers/github
```

## 🔧 다음 단계

### Option 1: 자동 설정 (추천)

사용자의 macOS 터미널에서:

```bash
# 1. 저장소 폴더로 이동
cd /Users/alex/너바나\ 프로젝트/호텔\ 룸첵

# 2. 설정 스크립트 실행
bash claude/setup-wif-github-actions.sh
```

이 스크립트는 다음을 자동으로 수행합니다:
- 필수 도구 (gcloud, gh) 확인
- Google Cloud 인증 확인
- WIF OIDC 공급업체 생성 (또는 기존 확인)
- 서비스 계정에 IAM 역할 부여
- GitHub Secret 자동 추가

### Option 2: 수동 설정

자세한 단계별 지시사항: [SETUP_WIF_GITHUB_ACTIONS.md](./SETUP_WIF_GITHUB_ACTIONS.md)

## 📊 현재 WIF 구성

```
GitHub (OIDC) 
    ↓
GitHub Actions 워크플로우
    ↓
google-github-actions/auth@v1
    ↓
WIF를 통한 토큰 교환
    ↓
Google Cloud 서비스 계정
    ↓
Cloud Run 배포
```

## 🔐 보안 고려사항

✅ **WIF의 장점**:
- 장기 JSON 키를 사용하지 않음
- OIDC 토큰은 단기(약 5분)
- 각 GitHub 워크플로우별로 격리된 인증
- 조직 정책의 보안 요구사항 준수

## 🚀 배포 흐름

1. **로컬 개발**: 사용자가 코드 작성/수정
2. **Git Push**: `git push origin main`
3. **GitHub Actions 트리거**: 자동으로 워크플로우 실행
4. **WIF 인증**: GitHub OIDC 토큰을 Google Cloud 토큰으로 교환
5. **Docker 빌드**: 이미지 빌드 후 GCR로 push
6. **Cloud Run 배포**: 최신 이미지로 자동 배포
7. **서비스 URL**: `https://hotel-roomcheck-{hash}.run.app`

## 📝 워크플로우 파일 위치

```
.github/workflows/deploy-to-cloud-run.yml
```

주요 단계:
- Cloud SDK 설정
- Workload Identity Federation 인증
- Docker 이미지 빌드 (PHP 8.4-Apache)
- Google Container Registry로 push
- Cloud Run에 배포
- 배포된 URL 출력

## ⚠️ 알려진 문제 및 해결 방법

### 문제 1: 조직 정책으로 JSON 키 생성 불가
**원인**: Google Cloud 조직 정책이 서비스 계정 API 키 생성을 비활성화
**해결**: WIF 사용 (현재 구현 중)

### 문제 2: 이전 WIF 공급업체 추가 UI 오류
**원인**: Google Cloud Console의 attribute condition 필드 접근성 문제
**해결**: gcloud CLI를 사용한 자동 생성 (setup-wif-github-actions.sh)

## 📞 지원

설정 중 문제가 발생하면:

1. 에러 메시지 확인
2. GitHub Actions 로그 확인: https://github.com/hihisys/hotel-roomcheck/actions
3. Google Cloud 콘솔에서 서비스 계정 권한 확인
4. `gcloud iam workload-identity-pools providers list --workload-identity-pool=github-pool` 실행

## 📚 참고 자료

- [Google Cloud Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions의 Workload Identity Federation](https://github.com/google-github-actions/auth)
- [Google Cloud Run 문서](https://cloud.google.com/run/docs)
- [GitHub Actions 보안 모범 사례](https://docs.github.com/en/actions/security-guides)

---

**마지막 업데이트**: 2026년 7월 27일
**다음 단계**: setup-wif-github-actions.sh 스크립트 실행
