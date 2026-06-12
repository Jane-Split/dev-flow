---
type: reference
name: design-contract-go
description: Go/Gin Design Contract 格式定义
language: go
---
applicable_types: [backend, fullstack]

# Design Contract（Go / Gin）

> **本文件定义 Go / 后端项目的 Design Contract 标准格式。**
> **Design 阶段根据 Research 识别的项目类型自动选择对应的契约格式。**
> **Java Contract 见 design.md 主文件。**

```yaml
# Design Contract（Go）
contract_version: "1.0"
language: "go"
framework: "Gin"  # 或 Echo / Fiber

# Struct 定义（对应 Java Entity）
models:
  - name: "User"
    file: "internal/model/user.go"
    tableName: "users"
    fields:
      - name: "ID"
        type: "uint"
        dbTag: "primaryKey;autoIncrement"
        jsonTag: "-"
      - name: "Username"
        type: "string"
        dbTag: "type:varchar(50);uniqueIndex;not null"
        jsonTag: "username"
      - name: "Status"
        type: "UserStatus"
        dbTag: "type:varchar(20);not null"
        jsonTag: "status"
      - name: "CreatedAt"
        type: "time.Time"
        dbTag: "autoCreateTime"
        jsonTag: "created_at"

# DTO/Request 结构体定义
dtos:
  - name: "CreateUserReq"
    file: "internal/dto/user_dto.go"
    purpose: "request"
    fields:
      - name: "Username"
        type: "string"
        binding: "required,min=1,max=50"
        jsonTag: "username"
      - name: "Password"
        type: "string"
        binding: "required,min=8"
        jsonTag: "password"

  - name: "UserResp"
    file: "internal/dto/user_dto.go"
    purpose: "response"
    fields:
      - name: "ID"
        type: "uint"
        jsonTag: "id"
      - name: "Username"
        type: "string"
        jsonTag: "username"
      - name: "Status"
        type: "UserStatus"
        jsonTag: "status"

# Service 定义
services:
  - name: "UserService"
    file: "internal/service/user_service.go"
    interfaceName: "IUserService"
    injectDependencies: ["*gorm.DB"]
    methods:
      - name: "Create"
        receiver: "us"
        params: ["ctx context.Context", "req *CreateUserReq"]
        returnType: "(*UserResp, error)"
        errors: ["ErrUserAlreadyExists", "ErrDBError"]
        description: "创建新用户"

      - name: "GetByID"
        receiver: "us"
        params: ["ctx context.Context", "id uint"]
        returnType: "(*UserResp, error)"
        errors: ["ErrUserNotFound"]
        description: "根据 ID 查询用户"

# Handler 定义（对应 Java Controller）
handlers:
  - name: "UserHandler"
    file: "internal/handler/user_handler.go"
    group: "/api/users"
    injectDependencies: ["IUserService"]
    apis:
      - method: "POST"
        path: "/"
        paramType: "CreateUserReq"
        returnType: "UserResp"
        statusCode: 201
        middleware: ["AuthMiddleware()"]
      - method: "GET"
        path: "/:id"
        returnType: "UserResp"
        middleware: ["AuthMiddleware()"]

# 枚举定义
enums:
  - name: "UserStatus"
    file: "internal/model/enum.go"
    type: "string"
    values:
      - name: "ACTIVE"
        value: "active"
        description: "正常"
      - name: "DISABLED"
        value: "disabled"
        description: "禁用"
    methods:
      - name: "IsValid"
        returnType: "bool"
        description: "验证枚举值是否有效"

# 跨子任务接口契约定义
interfaces:
  serviceContracts:
    - name: "IUserService"
      methods:
        - name: "GetByID"
          params: ["ctx context.Context", "id uint"]
          returnType: "(*UserResp, error)"
          stability: "frozen"
```
