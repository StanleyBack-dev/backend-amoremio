# Shared Kernel

Este diretório concentra contratos e utilitários reutilizáveis entre módulos.

## Princípios

- `domain`: não depende de NestJS, TypeORM ou GraphQL.
- `application`: orquestra casos de uso e depende de portas.
- `infrastructure`: implementa portas e integra com tecnologias.

## Convenções

- Prefira `type` imports para contratos.
- Regras de negócio devem ficar em módulos de domínio, não em controllers/resolvers.
- Efeitos colaterais (email, integrações externas) devem ser acionados por eventos.
