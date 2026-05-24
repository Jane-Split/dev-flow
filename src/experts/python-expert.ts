import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
import { writeText, fileExists } from '../utils/fs-utils.js';
import * as path from 'node:path';

export class PythonExpert extends BaseExpert {
  constructor(context: any) {
    super('PythonExpert', context);
  }

  canHandle(task: Task): boolean {
    // 通过 expert 字段显式指定
    if (task.expert === 'PythonExpert') {
      return true;
    }

    // 通过任务类型 + 描述关键词匹配
    const pythonKeywords = ['python', 'fastapi', 'flask', 'django', 'pydantic', 'pandas', 'asyncio'];
    const descLower = task.description.toLowerCase();
    if ((task.type === 'api' || task.type === 'logic') &&
        pythonKeywords.some(kw => descLower.includes(kw))) {
      return true;
    }

    // 通过输出文件扩展名匹配
    if (task.output.files.some(f => f.endsWith('.py'))) {
      return true;
    }

    return false;
  }

  async execute(task: Task): Promise<ExpertResult> {
    this.log(`执行任务: ${task.name}`);

    const files: string[] = [];
    const changes: ExpertResult['changes'] = [];

    for (const filePath of task.output.files) {
      const fullPath = path.join(this.getProjectRoot(), filePath);
      const code = this.generateCode(task, filePath);

      await writeText(fullPath, code);
      files.push(fullPath);
      changes.push({
        file: filePath,
        operation: 'create',
        description: `创建 ${task.name}`,
      });
    }

    const verification = await this.selfCheck(task, files);

    return {
      success: verification.passed,
      files,
      changes,
      verification,
    };
  }

  private generateCode(task: Task, filePath: string): string {
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    const moduleName = this.toModuleName(name);

    switch (task.type) {
      case 'api':
        return this.generateFastApiRoute(moduleName, task);
      case 'logic':
        return this.generateServiceClass(moduleName, task);
      case 'data':
        return this.generateDataModel(moduleName, task);
      default:
        return this.generateModuleSkeleton(moduleName, task);
    }
  }

  /**
   * 生成 FastAPI 路由模块
   */
  private generateFastApiRoute(moduleName: string, task: Task): string {
    const entityName = this.extractEntityName(task.description);
    const entityLower = entityName.toLowerCase();
    const entityTitle = entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase();

    return `"""
${task.description}
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/api/${entityLower}", tags=["${entityLower}"])


class ${entityTitle}CreateRequest(BaseModel):
    """创建${entityTitle}请求"""
    name: str = Field(..., min_length=1, max_length=255, description="名称")
    description: Optional[str] = Field(default=None, max_length=1000, description="描述")


class ${entityTitle}UpdateRequest(BaseModel):
    """更新${entityTitle}请求"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[str] = Field(default=None, pattern=r"^(ACTIVE|INACTIVE|ARCHIVED)$")


class ${entityTitle}Response(BaseModel):
    """${entityTitle}响应"""
    id: int
    name: str
    description: Optional[str]
    status: str

    model_config = {"from_attributes": True}


# 模拟数据存储
_db: dict[int, dict] = {}
_next_id: int = 1


@router.get("/", response_model=list[${entityTitle}Response])
async def find_all(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
) -> list[${entityTitle}Response]:
    """获取${entityTitle}列表"""
    items = list(_db.values())
    if status:
        items = [item for item in items if item["status"] == status]
    return [${entityTitle}Response(**item) for item in items[skip : skip + limit]]


@router.get("/{item_id}", response_model=${entityTitle}Response)
async def find_by_id(item_id: int) -> ${entityTitle}Response:
    """根据ID获取${entityTitle}"""
    item = _db.get(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="资源不存在")
    return ${entityTitle}Response(**item)


@router.post("/", response_model=${entityTitle}Response, status_code=status.HTTP_201_CREATED)
async def create(request: ${entityTitle}CreateRequest) -> ${entityTitle}Response:
    """创建${entityTitle}"""
    global _next_id
    item = {
        "id": _next_id,
        "name": request.name,
        "description": request.description,
        "status": "ACTIVE",
    }
    _db[_next_id] = item
    _next_id += 1
    return ${entityTitle}Response(**item)


@router.put("/{item_id}", response_model=${entityTitle}Response)
async def update(item_id: int, request: ${entityTitle}UpdateRequest) -> ${entityTitle}Response:
    """更新${entityTitle}"""
    item = _db.get(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="资源不存在")

    update_data = request.model_dump(exclude_unset=True)
    item.update(update_data)
    return ${entityTitle}Response(**item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(item_id: int) -> None:
    """删除${entityTitle}"""
    if item_id not in _db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="资源不存在")
    del _db[item_id]
`;
  }

  /**
   * 生成 Python 服务类
   */
  private generateServiceClass(moduleName: string, task: Task): string {
    const entityName = this.extractEntityName(task.description);
    const entityTitle = entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase();

    return `"""
${task.description}
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ${entityTitle}DTO:
    """${entityTitle}数据传输对象"""
    id: Optional[int] = None
    name: str = ""
    description: Optional[str] = None
    status: str = "ACTIVE"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ${entityTitle}NotFoundError(Exception):
    """${entityTitle}未找到异常"""
    def __init__(self, item_id: int) -> None:
        self.item_id = item_id
        super().__init__(f"${entityTitle} with id {item_id} not found")


class ${entityTitle}Service:
    """${entityTitle}服务类 - 处理${entityTitle}相关业务逻辑"""

    def __init__(self) -> None:
        self._storage: dict[int, ${entityTitle}DTO] = {}
        self._next_id: int = 1

    async def find_all(self, status: Optional[str] = None) -> list[${entityTitle}DTO]:
        """获取所有${entityTitle}"""
        items = list(self._storage.values())
        if status is not None:
            items = [item for item in items if item.status == status]
        return items

    async def find_by_id(self, item_id: int) -> ${entityTitle}DTO:
        """根据ID获取${entityTitle}"""
        item = self._storage.get(item_id)
        if item is None:
            raise ${entityTitle}NotFoundError(item_id)
        return item

    async def create(self, name: str, description: Optional[str] = None) -> ${entityTitle}DTO:
        """创建${entityTitle}"""
        now = datetime.now()
        dto = ${entityTitle}DTO(
            id=self._next_id,
            name=name,
            description=description,
            status="ACTIVE",
            created_at=now,
            updated_at=now,
        )
        self._storage[self._next_id] = dto
        self._next_id += 1
        logger.info("Created %s with id=%d", entityTitle, dto.id)
        return dto

    async def update(
        self,
        item_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
    ) -> ${entityTitle}DTO:
        """更新${entityTitle}"""
        item = await self.find_by_id(item_id)

        if name is not None:
            item.name = name
        if description is not None:
            item.description = description
        if status is not None:
            item.status = status
        item.updated_at = datetime.now()

        logger.info("Updated %s id=%d", entityTitle, item_id)
        return item

    async def delete(self, item_id: int) -> None:
        """删除${entityTitle}"""
        await self.find_by_id(item_id)
        del self._storage[item_id]
        logger.info("Deleted %s id=%d", entityTitle, item_id)

    async def process(self, item_id: int, action: str) -> ${entityTitle}DTO:
        """根据动作处理${entityTitle}"""
        item = await self.find_by_id(item_id)

        match action:
            case "activate":
                item.status = "ACTIVE"
            case "deactivate":
                item.status = "INACTIVE"
            case "archive":
                item.status = "ARCHIVED"
            case _:
                raise ValueError(f"Unknown action: {action}")

        item.updated_at = datetime.now()
        return item
`;
  }

  /**
   * 生成 Pydantic 数据模型
   */
  private generateDataModel(moduleName: string, task: Task): string {
    const entityName = this.extractEntityName(task.description);
    const entityTitle = entityName.charAt(0).toUpperCase() + entityName.slice(1).toLowerCase();

    return `"""
${task.description}
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ${entityTitle}Status(str, Enum):
    """${entityTitle}状态枚举"""
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ARCHIVED = "ARCHIVED"


class ${entityTitle}Base(BaseModel):
    """${entityTitle}基础模型"""
    name: str = Field(..., min_length=1, max_length=255, description="名称")
    description: Optional[str] = Field(default=None, max_length=1000, description="描述")


class ${entityTitle}Create(${entityTitle}Base):
    """创建${entityTitle}"""
    pass


class ${entityTitle}Update(BaseModel):
    """更新${entityTitle}"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[${entityTitle}Status] = None


class ${entityTitle}(${entityTitle}Base):
    """${entityTitle}完整模型"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ${entityTitle}Status = Field(default=${entityTitle}Status.ACTIVE)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None


class ${entityTitle}ListResponse(BaseModel):
    """${entityTitle}列表响应"""
    items: list[${entityTitle}]
    total: int
    page: int
    page_size: int


class ${entityTitle}Message(BaseModel):
    """操作结果消息"""
    message: str
    id: Optional[int] = None
`;
  }

  /**
   * 生成 Python 模块骨架
   */
  private generateModuleSkeleton(moduleName: string, task: Task): string {
    return `"""
${task.description}
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class ${moduleName}:
    """${task.description}"""

    def __init__(self, **kwargs: Any) -> None:
        self._config = kwargs

    async def execute(self, *args: Any, **kwargs: Any) -> Any:
        """执行主逻辑"""
        logger.info("Executing %s", self.__class__.__name__)
        result = await self._process(*args, **kwargs)
        return result

    async def _process(self, *args: Any, **kwargs: Any) -> Any:
        """内部处理逻辑"""
        raise NotImplementedError("Subclasses must implement _process")

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(config={self._config})"
`;
  }

  /**
   * 自检：验证文件是否成功创建
   */
  private async selfCheck(task: Task, files: string[]): Promise<{ passed: boolean; message: string }> {
    for (const file of files) {
      const exists = await fileExists(file);
      if (!exists) {
        return { passed: false, message: `文件未创建: ${file}` };
      }
    }
    return { passed: true, message: `自检通过，已创建 ${files.length} 个文件` };
  }

  /**
   * 将文件名转换为 Python 模块名 (snake_case)
   */
  private toModuleName(fileName: string): string {
    return fileName
      .replace(/([A-Z])/g, '_$1')
      .replace(/[-\s]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  /**
   * 从任务描述中提取实体名称
   */
  private extractEntityName(description: string): string {
    const match = description.match(/[\u4e00-\u9fa5]*([A-Z][a-zA-Z0-9]*)/);
    if (match) return match[1];

    const cnMatch = description.match(/([\u4e00-\u9fa5]{2,6})/);
    if (cnMatch) {
      return cnMatch[1]
        .split('')
        .map(char => char.charAt(0).toUpperCase() + char.slice(1))
        .join('');
    }

    return 'Item';
  }
}
