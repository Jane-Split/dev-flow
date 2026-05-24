import { BaseExpert, type ExpertResult } from './base-expert.js';
import type { Task } from '../planner/task-splitter.js';
import { writeText, fileExists } from '../utils/fs-utils.js';
import * as path from 'node:path';

export class JavaExpert extends BaseExpert {
  constructor(context: any) {
    super('JavaExpert', context);
  }

  canHandle(task: Task): boolean {
    // 通过 expert 字段显式指定
    if (task.expert === 'JavaExpert') {
      return true;
    }

    // 通过任务类型 + 描述关键词匹配
    const javaKeywords = ['java', 'spring', 'jpa', 'maven', 'gradle', 'jvm', 'servlet'];
    const descLower = task.description.toLowerCase();
    if ((task.type === 'api' || task.type === 'logic') &&
        javaKeywords.some(kw => descLower.includes(kw))) {
      return true;
    }

    // 通过输出文件扩展名匹配
    if (task.output.files.some(f => f.endsWith('.java'))) {
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
    const className = this.toClassName(name);

    switch (task.type) {
      case 'api':
        return this.generateRestController(className, task, filePath);
      case 'logic':
        return this.generateService(className, task, filePath);
      case 'data':
        return this.generateJpaEntity(className, task, filePath);
      default:
        return this.generateClassSkeleton(className, task, filePath);
    }
  }

  /**
   * 生成 Spring Boot REST Controller
   */
  private generateRestController(className: string, task: Task, filePath: string): string {
    const entityName = this.extractEntityName(task.description);
    const entityLower = entityName.toLowerCase();
    const packagePath = this.inferPackage(filePath);

    return `package ${packagePath};

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Optional;

/**
 * ${task.description}
 */
@RestController
@RequestMapping("/api/${entityLower}")
public record ${className}(
    ${entityName}Service ${entityLower}Service
) {

    @GetMapping
    public ResponseEntity<List<${entityName}Response>> findAll() {
        List<${entityName}Response> result = ${entityLower}Service.findAll();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<${entityName}Response> findById(@PathVariable Long id) {
        return ${entityLower}Service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<${entityName}Response> create(
            @RequestBody Create${entityName}Request request) {
        ${entityName}Response created = ${entityLower}Service.create(request);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${entityName}Response> update(
            @PathVariable Long id,
            @RequestBody Update${entityName}Request request) {
        return ${entityLower}Service.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ${entityLower}Service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

record ${entityName}Response(Long id, String name, String description, String status) {}

record Create${entityName}Request(String name, String description) {
    public ${entityName}Response toDomain() {
        return new ${entityName}Response(null, name, description, "ACTIVE");
    }
}

record Update${entityName}Request(String name, String description, String status) {}
`;
  }

  /**
   * 生成 Java Service 类
   */
  private generateService(className: string, task: Task, filePath: string): string {
    const entityName = this.extractEntityName(task.description);
    const packagePath = this.inferPackage(filePath);

    return `package ${packagePath};

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

/**
 * ${task.description}
 */
@Service
public class ${className} {

    private final ${entityName}Repository repository;

    public ${className}(${entityName}Repository repository) {
        this.repository = repository;
    }

    public List<${entityName}Response> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Optional<${entityName}Response> findById(Long id) {
        return repository.findById(id)
                .map(this::toResponse);
    }

    public ${entityName}Response create(Create${entityName}Request request) {
        ${entityName} entity = new ${entityName}(
                request.name(),
                request.description(),
                "ACTIVE",
                LocalDateTime.now()
        );
        ${entityName} saved = repository.save(entity);
        return toResponse(saved);
    }

    public Optional<${entityName}Response> update(Long id, Update${entityName}Request request) {
        return repository.findById(id).map(entity -> {
            ${entityName} updated = entity.applyUpdate(request);
            repository.save(updated);
            return toResponse(updated);
        });
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private ${entityName}Response toResponse(${entityName} entity) {
        return new ${entityName}Response(
                entity.id(),
                entity.name(),
                entity.description(),
                entity.status()
        );
    }
}
`;
  }

  /**
   * 生成 JPA Entity 类
   */
  private generateJpaEntity(className: string, task: Task, filePath: string): string {
    const packagePath = this.inferPackage(filePath);

    return `package ${packagePath};

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ${task.description}
 */
@Entity
@Table(name = "${className.toLowerCase()}s")
public sealed class ${className} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    protected ${className}() {}

    public ${className}(String name, String description, String status, LocalDateTime createdAt) {
        this.name = name;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long id() { return id; }
    public String name() { return name; }
    public String description() { return description; }
    public String status() { return status; }
    public LocalDateTime createdAt() { return createdAt; }
    public LocalDateTime updatedAt() { return updatedAt; }

    public ${className} applyUpdate(Update${className}Request request) {
        return switch (request) {
            case null -> this;
            default -> {
                if (request.name() != null) this.name = request.name();
                if (request.description() != null) this.description = request.description();
                if (request.status() != null) this.status = request.status();
                yield this;
            }
        };
    }
}
`;
  }

  /**
   * 生成 Java 类骨架
   */
  private generateClassSkeleton(className: string, task: Task, filePath: string): string {
    const packagePath = this.inferPackage(filePath);

    return `package ${packagePath};

/**
 * ${task.description}
 */
public class ${className} {

    public ${className}() {
        // 初始化
    }

    @Override
    public String toString() {
        return \"\"\"\"
                ${className}{
                    info='${task.description}'
                }\"\"\";
    }
}
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
   * 将文件名转换为 Java 类名 (PascalCase)
   */
  private toClassName(fileName: string): string {
    return fileName
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  /**
   * 从任务描述中提取实体名称
   */
  private extractEntityName(description: string): string {
    const match = description.match(/[\u4e00-\u9fa5]*([A-Z][a-zA-Z0-9]*)/);
    if (match) return match[1];

    const cnMatch = description.match(/([\u4e00-\u9fa5]{2,6})/);
    if (cnMatch) return this.toClassName(cnMatch[1]);

    return 'Entity';
  }

  /**
   * 根据文件路径推断包名
   */
  private inferPackage(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');
    const srcIdx = parts.lastIndexOf('src');
    if (srcIdx >= 0 && srcIdx + 1 < parts.length) {
      const javaIdx = parts.indexOf('java', srcIdx);
      if (javaIdx >= 0 && javaIdx + 1 < parts.length) {
        return parts.slice(javaIdx + 1, parts.length - 1).join('.');
      }
    }
    return 'com.example.app';
  }
}
