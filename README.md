```env
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=shop

REDIS_HOST=
REDIS_PORT=6379

JWT_SECRET=your-secret

TOSS_PAYMENT_CLIENT_KEY=test_ck_xxx
TOSS_PAYMENT_API_KEY=test_sk_xxx
```

## Documentation

- [SPEC.md](./SPEC.md) - 기능 명세
- [CLAUDE.md](./CLAUDE.md) - AI 코딩 지침
- [openapi.yml](./openapi.yml) - API 스펙


## Build (Cloud Native Buildpacks)
`pack` 빌드는 `project.toml` 설정(로컬 `node_modules` 제외, `NPM_CONFIG_LEGACY_PEER_DEPS=true`)을 사용합니다.

```shell
pack build nest-shop --builder paketobuildpacks/builder-jammy-base --pull-policy if-not-present
```

런타임 시작 명령은 `Procfile`의 `web: node dist/src/main.js`를 사용합니다.

> Docker Desktop에서 containerd 이미지 저장소가 활성화된 경우  
> `ERROR: failed to find OS in run image config`가 발생할 수 있습니다.
>
> 이 경우 아래 중 하나로 해결하세요.
> 1. Docker Desktop 설정에서 **Use containerd for pulling and storing images** 비활성화 후 다시 빌드
> 2. 레지스트리로 직접 푸시하는 방식으로 빌드:
>    `pack build <registry>/<image>:<tag> --builder paketobuildpacks/builder-jammy-base --publish`
