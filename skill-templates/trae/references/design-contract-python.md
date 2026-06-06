---
type: reference
name: design-contract-python
description: Python/FastAPI Design Contract 格式定义
language: python
---

# Design Contract（Python / FastAPI）

> **本文件定义 Python / 后端项目的 Design Contract 标准格式。**
> **Design 阶段根据 Research 识别的项目类型自动选择对应的契约格式。**
> **Java Contract 见 design.md 主文件。**

```yaml
# Design Contract（Python）
contract_version: "1.0"
language: "python"
framework: "FastAPI"  # 或 Django / Flask

# Model 定义（对应 Java Entity）
models:
  - name: "User"
    file: "app/models/user.py"
    baseClass: "Base"  # SQLAlchemy Base / Django Model
    tableName: "users"
    fields:
      - name: "id"
        type: "int"
        columnType: "Integer"
        primaryKey: true
        autoIncrement: true
        pydanticType: "int"
      - name: "username"
        type: "str"
        columnType: "String(50)"
        nullable: false
        unique: true
        pydanticType: "str"
      - name: "status"
        type: "UserStatus"
        columnType: "Enum(UserStatus)"
        nullable: false
        pydanticType: "UserStatus"
      - name: "created_at"
        type: "datetime"
        columnType: "DateTime"
        default: "now()"
        pydanticType: "datetime"

# Schema/DTO 定义
schemas:
  - name: "UserCreate"
    file: "app/schemas/user.py"
    baseClass: "BaseModel"  # Pydantic
    fields:
      - name: "username"
        type: "str"
        constraints: "min_length=1, max_length=50"
      - name: "password"
        type: "str"
        constraints: "min_length=8"

  - name: "UserResponse"
    file: "app/schemas/user.py"
    baseClass: "BaseModel"
    fields:
      - name: "id"
        type: "int"
      - name: "username"
        type: "str"
      - name: "status"
        type: "UserStatus"
    config: "from_attributes = True"

# Service/UseCase 定义
services:
  - name: "UserService"
    file: "app/services/user_service.py"
    injectDependencies: ["SessionLocal", "pwd_context"]
    methods:
      - name: "create_user"
        params: ["UserCreate"]
        returnType: "UserResponse"
        raises: ["HTTPException(409)", "ValidationError"]
        description: "创建新用户"

      - name: "get_user_by_id"
        params: ["int"]
        returnType: "UserResponse | None"
        raises: ["HTTPException(404)"]
        description: "根据 ID 查询用户"

# Router 定义（对应 Java Controller）
routers:
  - name: "user_router"
    file: "app/routers/users.py"
    prefix: "/api/users"
    tags: ["users"]
    dependencies: ["get_db", "get_current_user"]
    apis:
      - method: "POST"
        path: "/"
        paramType: "UserCreate"
        returnType: "UserResponse"
        status_code: 201
        response_model: "UserResponse"

      - method: "GET"
        path: "/{user_id}"
        returnType: "UserResponse"
        response_model: "UserResponse"

# 枚举定义
enums:
  - name: "UserStatus"
    file: "app/models/enums.py"
    baseClass: "str, enum.Enum"
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
    - name: "UserService"
      methods:
        - name: "get_user_by_id"
          params: ["int"]
          returnType: "UserResponse | None"
          stability: "frozen"
```
