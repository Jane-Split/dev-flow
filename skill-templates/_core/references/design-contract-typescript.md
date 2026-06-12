---
type: reference
name: design-contract-typescript
description: TypeScript/NestJS Design Contract 格式定义
language: typescript
---
applicable_types: [frontend, fullstack, java-fullstack]


# Design Contract（TypeScript / NestJS）

> **本文件定义 TypeScript / 前端项目的 Design Contract 标准格式。**
> **Design 阶段根据 Research 识别的项目类型自动选择对应的契约格式。**
> **Java Contract 见 design.md 主文件。**

```yaml
# Design Contract（TypeScript）
contract_version: "1.0"
language: "typescript"
framework: "NestJS"  # 或 Express / Fastify

# Interface/Model 定义（对应 Java Entity）
models:
  - name: "User"
    file: "src/users/user.model.ts"
    type: "interface"  # interface / type / class
    fields:
      - name: "id"
        type: "number"
        optional: false
        decorator: "@PrimaryKey() @AutoIncrement()"
      - name: "username"
        type: "string"
        optional: false
        decorator: "@Column({ type: 'varchar', length: 50 })"
      - name: "status"
        type: "UserStatus"
        optional: false
        decorator: "@Column({ type: 'enum', enum: UserStatus })"
      - name: "createdAt"
        type: "Date"
        optional: false
        decorator: "@CreatedAt"

# DTO 定义
dtos:
  - name: "CreateUserDTO"
    file: "src/users/dto/create-user.dto.ts"
    type: "class"
    fields:
      - name: "username"
        type: "string"
        validation: "@IsString() @Length(1, 50)"
      - name: "password"
        type: "string"
        validation: "@IsString() @MinLength(8)"

  - name: "UserResponseDTO"
    file: "src/users/dto/user-response.dto.ts"
    type: "class"
    fields:
      - name: "id"
        type: "number"
      - name: "username"
        type: "string"

# Service 定义
services:
  - name: "UsersService"
    file: "src/users/users.service.ts"
    injectDependencies: ["Repository<User>", "HashService"]
    methods:
      - name: "create"
        params: ["CreateUserDTO"]
        returnType: "Promise<UserResponseDTO>"
        throws: ["ConflictException", "BadRequestException"]
        description: "创建新用户"

      - name: "findById"
        params: ["number"]
        returnType: "Promise<UserResponseDTO | null>"
        throws: ["NotFoundException"]
        description: "根据 ID 查询用户"

# Controller 定义
controllers:
  - name: "UsersController"
    file: "src/users/users.controller.ts"
    basePath: "/api/users"
    injectDependencies: ["UsersService"]
    apis:
      - method: "POST"
        path: "/"
        paramType: "CreateUserDTO"
        returnType: "UserResponseDTO"
        decorator: "@Post() @UseGuards(JwtAuthGuard)"
        status: 201

      - method: "GET"
        path: "/:id"
        returnType: "UserResponseDTO"
        decorator: "@Get(':id') @UseGuards(JwtAuthGuard)"

# 枚举定义
enums:
  - name: "UserStatus"
    file: "src/users/enums/user-status.enum.ts"
    values:
      - name: "ACTIVE"
        value: "active"
        description: "正常"
      - name: "DISABLED"
        value: "disabled"
        description: "禁用"

# 跨子任务接口契约定义
interfaces:
  serviceContracts:
    - name: "UsersService"
      methods:
        - name: "findById"
          params: ["number"]
          returnType: "Promise<UserResponseDTO | null>"
          stability: "frozen"
```
