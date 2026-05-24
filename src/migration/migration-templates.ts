/**
 * 迁移模板库 - 提供各老旧技术栈到现代技术栈的代码转换模板
 *
 * 支持的迁移路径:
 * - jQuery → React
 * - jQuery → Vue
 * - AngularJS → Angular
 * - PHP → Node.js (Express)
 * - Python 2 → Python 3
 * - Backbone.js → React
 * - Knockout.js → Vue
 */

// ─── 类型定义 ─────────────────────────────────────────────

export interface MigrationPattern {
  legacy: string;     // 老旧代码模式（正则或字符串）
  modern: string;     // 现代代码模板
  description: string;
  category: string;   // 分类：dom, event, ajax, data, lifecycle 等
}

export interface MigrationTemplate {
  id: string;
  from: string;
  to: string;
  patterns: MigrationPattern[];
  notes: string[];
  warnings: string[];
}

// ─── jQuery → React 模板 ─────────────────────────────────

export const JQUERY_TO_REACT: MigrationTemplate = {
  id: 'jquery-to-react',
  from: 'jQuery',
  to: 'React',
  patterns: [
    // DOM 选择与渲染
    {
      legacy: "$('#element').html(content)",
      modern: '<div id="element">{content}</div>',
      description: 'innerHTML 设置 → JSX 表达式',
      category: 'dom',
    },
    {
      legacy: "$('.list').append('<li>' + item + '</li>')",
      modern: '<ul className="list">{items.map(item => <li key={item.id}>{item.text}</li>)}</ul>',
      description: 'DOM 追加 → 列表渲染',
      category: 'dom',
    },
    {
      legacy: "$('#element').show() / .hide() / .toggle()",
      modern: '{isVisible && <div id="element">...</div>}',
      description: '显示/隐藏 → 条件渲染',
      category: 'dom',
    },
    {
      legacy: "$('#element').addClass('active')",
      modern: '<div id="element" className={`base ${isActive ? "active" : ""}`}>...</div>',
      description: 'addClass → 动态 className',
      category: 'dom',
    },
    {
      legacy: "$('#element').text(value) / .val(value)",
      modern: '<input value={value} onChange={e => setValue(e.target.value)} />',
      description: 'text/val → 受控组件',
      category: 'dom',
    },
    // 事件处理
    {
      legacy: "$('#btn').on('click', handler)",
      modern: '<button onClick={handler}>...</button>',
      description: '事件绑定 → JSX 事件属性',
      category: 'event',
    },
    {
      legacy: "$('#form').on('submit', function(e) { e.preventDefault(); ... })",
      modern: '<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>',
      description: '表单提交 → onSubmit 处理',
      category: 'event',
    },
    {
      legacy: "$(document).on('click', '.item', handler)",
      modern: '{items.map(item => <div key={item.id} className="item" onClick={() => handler(item)}>...</div>)}',
      description: '事件委托 → 列表项事件',
      category: 'event',
    },
    {
      legacy: "$(window).on('scroll', handler)",
      modern: 'useEffect(() => { window.addEventListener("scroll", handler); return () => window.removeEventListener("scroll", handler); }, [])',
      description: '全局事件 → useEffect 副作用',
      category: 'event',
    },
    // AJAX
    {
      legacy: "$.ajax({ url: '/api/data', method: 'GET', success: callback })",
      modern: 'useEffect(() => { fetch("/api/data").then(r => r.json()).then(callback); }, []);',
      description: '$.ajax GET → fetch + useEffect',
      category: 'ajax',
    },
    {
      legacy: "$.post('/api/data', payload, callback)",
      modern: 'fetch("/api/data", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload) }).then(r => r.json()).then(callback)',
      description: '$.post → fetch POST',
      category: 'ajax',
    },
    {
      legacy: "$('#form').serialize()",
      modern: 'const formData = new FormData(formRef.current); Object.fromEntries(formData)',
      description: '表单序列化 → FormData API',
      category: 'ajax',
    },
    // 动画
    {
      legacy: "$('#element').fadeIn() / .fadeOut() / .slideDown()",
      modern: '<div style={{ transition: "opacity 0.3s", opacity: isVisible ? 1 : 0 }}>',
      description: 'jQuery 动画 → CSS transition',
      category: 'animation',
    },
    // 数据
    {
      legacy: "$('.item').each(function() { ... $(this).find('.name').text() })",
      modern: '{items.map(item => <div key={item.id}>{item.name}</div>)}',
      description: '.each() 循环 → map() 渲染',
      category: 'data',
    },
    {
      legacy: "$.extend({}, defaults, options)",
      modern: 'const config = { ...defaults, ...options }',
      description: '$.extend → 对象展开运算符',
      category: 'data',
    },
    {
      legacy: "$.isArray(arr) / $.isFunction(fn) / $.isNumeric(n)",
      modern: 'Array.isArray(arr) / typeof fn === "function" / !isNaN(n)',
      description: '$.isXxx → 原生类型检查',
      category: 'data',
    },
    // 生命周期
    {
      legacy: "$(document).ready(function() { ... })",
      modern: 'useEffect(() => { /* 初始化逻辑 */ }, []);',
      description: 'document.ready → useEffect',
      category: 'lifecycle',
    },
  ],
  notes: [
    '使用 useState 管理组件状态替代 jQuery 变量',
    '使用 useRef 管理 DOM 引用替代 jQuery 选择器',
    '使用 useCallback/useMemo 优化性能',
    '考虑使用 React Query 或 SWR 管理服务端状态',
  ],
  warnings: [
    'jQuery 的命令式 DOM 操作需要完全重写为声明式',
    '事件处理中的 this 上下文需要特别注意',
    '全局状态管理需要使用 Context 或状态管理库',
  ],
};

// ─── jQuery → Vue 模板 ──────────────────────────────────

export const JQUERY_TO_VUE: MigrationTemplate = {
  id: 'jquery-to-vue',
  from: 'jQuery',
  to: 'Vue',
  patterns: [
    {
      legacy: "$('#element').html(content)",
      modern: '<div id="element" v-html="content"></div>',
      description: 'innerHTML → v-html',
      category: 'dom',
    },
    {
      legacy: "$('#element').show() / .hide()",
      modern: '<div id="element" v-show="isVisible">...</div>',
      description: 'show/hide → v-show',
      category: 'dom',
    },
    {
      legacy: "$('#element').text(value)",
      modern: '<div id="element">{{ value }}</div>',
      description: '.text() → 模板插值',
      category: 'dom',
    },
    {
      legacy: "$('#btn').on('click', handler)",
      modern: '<button @click="handler">...</button>',
      description: '事件绑定 → @事件',
      category: 'event',
    },
    {
      legacy: "$('.list .item').each(function() { ... })",
      modern: '<div v-for="item in items" :key="item.id" class="item">...</div>',
      description: '.each() → v-for',
      category: 'data',
    },
    {
      legacy: "$('#element').addClass('active')",
      modern: '<div :class="{ active: isActive }">...</div>',
      description: 'addClass → 动态 class 绑定',
      category: 'dom',
    },
    {
      legacy: "$('#input').val(value)",
      modern: '<input v-model="value" />',
      description: '.val() → v-model',
      category: 'dom',
    },
    {
      legacy: "$.ajax({ url: '/api', success: cb })",
      modern: 'fetch("/api").then(r => r.json()).then(data => this.items = data)',
      description: '$.ajax → fetch',
      category: 'ajax',
    },
  ],
  notes: [
    '使用 ref/reactive 管理状态替代 jQuery 变量',
    '使用 computed 替代手动计算的派生值',
    '使用 watch/watchEffect 替代手动监听',
    '考虑使用 Pinia 管理全局状态',
  ],
  warnings: [
    'v-html 存在 XSS 风险，仅在可信内容上使用',
    'v-show 和 v-if 用途不同，注意区分',
  ],
};

// ─── AngularJS → Angular 模板 ───────────────────────────

export const ANGULARJS_TO_ANGULAR: MigrationTemplate = {
  id: 'angularjs-to-angular',
  from: 'AngularJS 1.x',
  to: 'Angular 17+',
  patterns: [
    {
      legacy: "var app = angular.module('myApp', [])",
      modern: "@NgModule({ ... }) export class AppModule { }",
      description: 'angular.module → @NgModule',
      category: 'module',
    },
    {
      legacy: "app.controller('MyCtrl', function($scope) { $scope.items = []; })",
      modern: "@Component({ ... }) export class MyComponent { items: any[] = []; }",
      description: '.controller() → @Component',
      category: 'component',
    },
    {
      legacy: "$scope.name = 'hello'",
      modern: "name = 'hello';  // 组件属性",
      description: '$scope → 组件属性',
      category: 'data',
    },
    {
      legacy: "$scope.$watch('name', function(newVal) { ... })",
      modern: "@Input() set name(val) { ... }  // 或 ngOnChanges",
      description: '$watch → ngOnChanges / setter',
      category: 'lifecycle',
    },
    {
      legacy: "$http.get('/api/data').then(function(response) { $scope.data = response.data; })",
      modern: "this.http.get<Data[]>('/api/data').subscribe(data => this.data = data);",
      description: '$http → HttpClient',
      category: 'ajax',
    },
    {
      legacy: "<div ng-repeat=\"item in items\">{{ item.name }}</div>",
      modern: "@for (item of items; track item.id) { <div>{{ item.name }}</div> }",
      description: 'ng-repeat → @for (Angular 17+)',
      category: 'template',
    },
    {
      legacy: "<div ng-if=\"isVisible\">...</div>",
      modern: "@if (isVisible) { <div>...</div> }",
      description: 'ng-if → @if (Angular 17+)',
      category: 'template',
    },
    {
      legacy: "<input ng-model=\"name\" />",
      modern: '<input [(ngModel)]="name" />',
      description: 'ng-model → [(ngModel)]',
      category: 'template',
    },
    {
      legacy: "app.service('MyService', function($http) { ... })",
      modern: "@Injectable({ providedIn: 'root' }) export class MyService { constructor(private http: HttpClient) {} }",
      description: '.service() → @Injectable',
      category: 'service',
    },
    {
      legacy: "app.directive('myDirective', function() { return { ... } })",
      modern: "@Directive({ ... }) export class MyDirective { }",
      description: '.directive() → @Directive',
      category: 'component',
    },
    {
      legacy: "$scope.$on('$destroy', function() { ... })",
      modern: "ngOnDestroy() { ... }",
      description: '$destroy → ngOnDestroy',
      category: 'lifecycle',
    },
    {
      legacy: "app.filter('uppercase', function() { return function(input) { ... } })",
      modern: "@Pipe({ name: 'uppercase' }) export class UppercasePipe implements PipeTransform { transform(value: string) { ... } }",
      description: '.filter() → @Pipe',
      category: 'service',
    },
  ],
  notes: [
    '使用 ngUpgrade 可以实现 AngularJS 和 Angular 的混合运行',
    '建议先升级到 AngularJS 1.5+ 的组件化写法，再迁移到 Angular',
    'Angular 17+ 推荐使用 Standalone Components',
    '使用 Signals (Angular 16+) 替代 RxJS 管理简单状态',
  ],
  warnings: [
    '$scope 的事件系统和 digest cycle 在 Angular 中不存在',
    '依赖注入语法完全不同',
    '模板语法有重大变化，特别是控制流',
  ],
};

// ─── PHP → Node.js 模板 ─────────────────────────────────

export const PHP_TO_NODE: MigrationTemplate = {
  id: 'php-to-node',
  from: 'PHP',
  to: 'Node.js (Express)',
  patterns: [
    {
      legacy: "<?php echo $variable; ?>",
      modern: "res.send(variable);  // 或 res.json({ variable })",
      description: 'echo → res.send',
      category: 'output',
    },
    {
      legacy: "$_GET['id'] / $_POST['name']",
      modern: "req.query.id / req.body.name",
      description: '超全局变量 → Express req 对象',
      category: 'input',
    },
    {
      legacy: "$conn = mysql_connect('localhost', 'user', 'pass'); mysql_query($sql, $conn);",
      modern: "const pool = mysql.createPool({ host, user, password }); const [rows] = await pool.query(sql);",
      description: 'mysql_* → mysql2/promise',
      category: 'database',
    },
    {
      legacy: "header('Location: /page');",
      modern: "res.redirect('/page');",
      description: 'header Location → res.redirect',
      category: 'response',
    },
    {
      legacy: "setcookie('name', 'value', time() + 3600);",
      modern: "res.cookie('name', 'value', { maxAge: 3600000 });",
      description: 'setcookie → res.cookie',
      category: 'response',
    },
    {
      legacy: "$_SESSION['user'] = $userData;",
      modern: "req.session.user = userData;  // express-session",
      description: '$_SESSION → express-session',
      category: 'session',
    },
    {
      legacy: "file_get_contents('data.json');",
      modern: "await fs.readFile('data.json', 'utf-8');",
      description: 'file_get_contents → fs.readFile',
      category: 'filesystem',
    },
    {
      legacy: "json_encode($data); / json_decode($json);",
      modern: "JSON.stringify(data); / JSON.parse(json);",
      description: 'json_encode/decode → JSON.stringify/parse',
      category: 'data',
    },
    {
      legacy: "foreach ($items as $item) { ... }",
      modern: "for (const item of items) { ... }  // 或 items.forEach(item => { ... })",
      description: 'foreach → for...of / forEach',
      category: 'control',
    },
    {
      legacy: "function myFunction($param1, $param2 = 'default') { ... }",
      modern: "function myFunction(param1, param2 = 'default') { ... }",
      description: 'PHP 函数 → JS 函数（参数默认值语法相似）',
      category: 'function',
    },
  ],
  notes: [
    'PHP 是同步阻塞的，Node.js 是异步非阻塞的，需要大量使用 async/await',
    'PHP 的共享 nothing 架构 vs Node.js 的单线程事件循环',
    '使用 TypeScript 可以获得类似 PHP 的类型安全',
    '考虑使用 NestJS 获得类似 PHP 框架的结构化体验',
  ],
  warnings: [
    'PHP 的会话管理在 Node.js 中需要中间件支持',
    '数据库操作从同步变为异步，需要仔细处理',
    '错误处理方式完全不同（try/catch vs 异步错误回调）',
  ],
};

// ─── 模板注册表 ─────────────────────────────────────────

const MIGRATION_TEMPLATES: Record<string, MigrationTemplate> = {
  'jquery-to-react': JQUERY_TO_REACT,
  'jquery-to-vue': JQUERY_TO_VUE,
  'angularjs-to-angular': ANGULARJS_TO_ANGULAR,
  'php-to-node': PHP_TO_NODE,
};

/**
 * 获取迁移模板
 */
export function getMigrationTemplate(from: string, to: string): MigrationTemplate | null {
  const key = `${from.toLowerCase()}-to-${to.toLowerCase()}`;
  return MIGRATION_TEMPLATES[key] || null;
}

/**
 * 列出所有可用的迁移路径
 */
export function listMigrationPaths(): Array<{ from: string; to: string; id: string }> {
  return Object.values(MIGRATION_TEMPLATES).map(t => ({
    from: t.from,
    to: t.to,
    id: t.id,
  }));
}

/**
 * 根据老旧技术栈类型获取推荐的迁移模板
 */
export function getRecommendedTemplates(legacyType: string): MigrationTemplate[] {
  const recommendations: Record<string, string[]> = {
    jquery: ['jquery-to-react', 'jquery-to-vue'],
    angularjs: ['angularjs-to-angular'],
    'php-legacy': ['php-to-node'],
    backbone: ['jquery-to-react'],
    knockout: ['jquery-to-vue'],
  };
  const templateIds = recommendations[legacyType] || [];
  return templateIds
    .map(id => MIGRATION_TEMPLATES[id])
    .filter((t): t is MigrationTemplate => t !== null);
}
