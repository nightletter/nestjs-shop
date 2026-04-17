```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=shop
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret
TOSS_PAYMENT_CLIENT_KEY=test_ck_xxx
TOSS_PAYMENT_API_KEY=test_sk_xxx
```

## Documentation

- [SPEC.md](./SPEC.md) - 기능 명세
- [CLAUDE.md](./CLAUDE.md) - AI 코딩 지침
- [openapi.yml](./openapi.yml) - API 스펙


## build
`pack` 빌드는 `project.toml` 설정(로컬 `node_modules` 제외, `NPM_CONFIG_LEGACY_PEER_DEPS=true`)을 사용합니다.

```shell
pack build nest-shop --builder paketobuildpacks/builder-jammy-base
```

런타임 시작 명령은 `Procfile`의 `web: node dist/src/main.js`를 사용합니다.
