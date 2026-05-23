/**
 * 算法模板库 - 提供常见算法的代码模板和测试生成
 *
 * 支持的算法类型:
 * - 排序: 冒泡、选择、插入、快速、归并、堆排序
 * - 搜索: 线性、二分、BFS、DFS
 * - 数据结构: 链表、栈、队列、哈希表、二叉树
 * - 动态规划: 斐波那契、背包、最长子序列
 * - 其他: 递归、回溯、贪心
 */

export interface AlgorithmTemplate {
  name: string;
  keywords: string[];
  category: string;
  complexity: { time: string; space: string };
  generate: (taskName: string) => { code: string; test: string };
}

// ==================== 排序算法 ====================

const bubbleSortTemplate: AlgorithmTemplate = {
  name: '冒泡排序',
  keywords: ['冒泡排序', 'bubble sort', 'bubble'],
  category: '排序',
  complexity: { time: 'O(n^2)', space: 'O(1)' },
  generate: (taskName: string) => ({
    code: `/**
 * 冒泡排序 (Bubble Sort)
 *
 * 算法思想: 重复遍历数组，比较相邻元素，如果顺序错误则交换。
 * 每一轮遍历会将最大的未排序元素"冒泡"到数组末尾。
 *
 * 时间复杂度: O(n^2) - 最坏和平均情况
 * 空间复杂度: O(1) - 原地排序
 * 稳定性: 稳定排序
 *
 * @param arr - 待排序的数字数组
 * @returns 排序后的新数组（升序）
 */
export function bubbleSort(arr: number[]): number[] {
  // 边界处理：空数组或单元素数组无需排序
  if (arr.length <= 1) {
    return [...arr];
  }

  const result = [...arr];
  const n = result.length;

  // 外层循环：控制遍历轮数
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;

    // 内层循环：比较相邻元素
    // 每轮结束后，末尾 i 个元素已排好序，无需再比较
    for (let j = 0; j < n - 1 - i; j++) {
      if (result[j] > result[j + 1]) {
        // 交换相邻元素
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
        swapped = true;
      }
    }

    // 优化：如果本轮没有发生交换，说明数组已有序
    if (!swapped) {
      break;
    }
  }

  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { bubbleSort } from './${taskName}.js';

describe('${taskName} - 冒泡排序', () => {
  it('应对空数组返回空数组', () => {
    expect(bubbleSort([])).toEqual([]);
  });

  it('应对单元素数组返回自身', () => {
    expect(bubbleSort([42])).toEqual([42]);
  });

  it('应对已排序数组保持顺序', () => {
    expect(bubbleSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it('应对逆序数组正确排序', () => {
    expect(bubbleSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
  });

  it('应对含重复元素的数组正确排序', () => {
    expect(bubbleSort([3, 1, 4, 1, 5, 9, 2, 6, 5])).toEqual([1, 1, 2, 3, 4, 5, 5, 6, 9]);
  });

  it('应对负数数组正确排序', () => {
    expect(bubbleSort([-3, -1, -4, -1, -5])).toEqual([-5, -4, -3, -1, -1]);
  });

  it('不应修改原始数组', () => {
    const original = [3, 1, 2];
    const result = bubbleSort(original);
    expect(original).toEqual([3, 1, 2]);
    expect(result).toEqual([1, 2, 3]);
  });
});
`,
  }),
};

const selectionSortTemplate: AlgorithmTemplate = {
  name: '选择排序',
  keywords: ['选择排序', 'selection sort', 'selection'],
  category: '排序',
  complexity: { time: 'O(n^2)', space: 'O(1)' },
  generate: (taskName: string) => ({
    code: `/**
 * 选择排序 (Selection Sort)
 *
 * 算法思想: 每一轮从未排序部分找到最小元素，将其放到已排序部分的末尾。
 *
 * 时间复杂度: O(n^2) - 所有情况
 * 空间复杂度: O(1) - 原地排序
 * 稳定性: 不稳定排序
 *
 * @param arr - 待排序的数字数组
 * @returns 排序后的新数组（升序）
 */
export function selectionSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return [...arr];
  }

  const result = [...arr];
  const n = result.length;

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;

    // 在未排序部分中寻找最小值
    for (let j = i + 1; j < n; j++) {
      if (result[j] < result[minIndex]) {
        minIndex = j;
      }
    }

    // 将最小值交换到已排序部分的末尾
    if (minIndex !== i) {
      [result[i], result[minIndex]] = [result[minIndex], result[i]];
    }
  }

  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { selectionSort } from './${taskName}.js';

describe('${taskName} - 选择排序', () => {
  it('应对空数组返回空数组', () => {
    expect(selectionSort([])).toEqual([]);
  });

  it('应对单元素数组返回自身', () => {
    expect(selectionSort([42])).toEqual([42]);
  });

  it('应对乱序数组正确排序', () => {
    expect(selectionSort([64, 25, 12, 22, 11])).toEqual([11, 12, 22, 25, 64]);
  });

  it('应对含重复元素的数组正确排序', () => {
    expect(selectionSort([5, 2, 5, 1, 2])).toEqual([1, 2, 2, 5, 5]);
  });

  it('应对负数数组正确排序', () => {
    expect(selectionSort([-5, 3, -1, 0, 2])).toEqual([-5, -1, 0, 2, 3]);
  });
});
`,
  }),
};

const insertionSortTemplate: AlgorithmTemplate = {
  name: '插入排序',
  keywords: ['插入排序', 'insertion sort', 'insertion'],
  category: '排序',
  complexity: { time: 'O(n^2)', space: 'O(1)' },
  generate: (taskName: string) => ({
    code: `/**
 * 插入排序 (Insertion Sort)
 *
 * 算法思想: 将数组分为已排序和未排序两部分，逐个将未排序元素插入到已排序部分的正确位置。
 * 类似于打扑克牌时整理手牌的过程。
 *
 * 时间复杂度: O(n^2) - 最坏和平均情况; O(n) - 最好情况（已排序）
 * 空间复杂度: O(1) - 原地排序
 * 稳定性: 稳定排序
 *
 * @param arr - 待排序的数字数组
 * @returns 排序后的新数组（升序）
 */
export function insertionSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return [...arr];
  }

  const result = [...arr];
  const n = result.length;

  // 从第二个元素开始，逐个插入到已排序部分的正确位置
  for (let i = 1; i < n; i++) {
    const key = result[i];
    let j = i - 1;

    // 将比 key 大的元素向后移动
    while (j >= 0 && result[j] > key) {
      result[j + 1] = result[j];
      j--;
    }

    // 插入 key 到正确位置
    result[j + 1] = key;
  }

  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { insertionSort } from './${taskName}.js';

describe('${taskName} - 插入排序', () => {
  it('应对空数组返回空数组', () => {
    expect(insertionSort([])).toEqual([]);
  });

  it('应对已排序数组保持顺序', () => {
    expect(insertionSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it('应对逆序数组正确排序', () => {
    expect(insertionSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
  });

  it('应对含重复元素的数组正确排序', () => {
    expect(insertionSort([3, 1, 4, 1, 5, 9, 2, 6])).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  it('应对负数数组正确排序', () => {
    expect(insertionSort([-3, -1, -4, -1, -5])).toEqual([-5, -4, -3, -1, -1]);
  });
});
`,
  }),
};

const quickSortTemplate: AlgorithmTemplate = {
  name: '快速排序',
  keywords: ['快速排序', 'quick sort', 'quicksort', 'quick'],
  category: '排序',
  complexity: { time: 'O(n log n)', space: 'O(log n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 快速排序 (Quick Sort)
 *
 * 算法思想: 选择一个基准元素(pivot)，将数组分为小于基准和大于基准两部分，
 * 然后对两部分递归地进行快速排序。
 *
 * 时间复杂度: O(n log n) - 平均情况; O(n^2) - 最坏情况
 * 空间复杂度: O(log n) - 递归调用栈
 * 稳定性: 不稳定排序
 *
 * @param arr - 待排序的数字数组
 * @returns 排序后的新数组（升序）
 */
export function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return [...arr];
  }

  const result = [...arr];

  function partition(low: number, high: number): number {
    // 选择中间元素作为基准，避免最坏情况
    const mid = Math.floor((low + high) / 2);
    [result[high], result[mid]] = [result[mid], result[high]];
    const pivot = result[high];

    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (result[j] <= pivot) {
        i++;
        [result[i], result[j]] = [result[j], result[i]];
      }
    }

    [result[i + 1], result[high]] = [result[high], result[i + 1]];
    return i + 1;
  }

  function sort(low: number, high: number): void {
    if (low < high) {
      const pi = partition(low, high);
      sort(low, pi - 1);
      sort(pi + 1, high);
    }
  }

  sort(0, result.length - 1);
  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { quickSort } from './${taskName}.js';

describe('${taskName} - 快速排序', () => {
  it('应对空数组返回空数组', () => {
    expect(quickSort([])).toEqual([]);
  });

  it('应对单元素数组返回自身', () => {
    expect(quickSort([42])).toEqual([42]);
  });

  it('应对乱序数组正确排序', () => {
    expect(quickSort([10, 7, 8, 9, 1, 5])).toEqual([1, 5, 7, 8, 9, 10]);
  });

  it('应对已排序数组保持顺序', () => {
    expect(quickSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it('应对含重复元素的数组正确排序', () => {
    expect(quickSort([3, 1, 4, 1, 5, 9, 2, 6, 5])).toEqual([1, 1, 2, 3, 4, 5, 5, 6, 9]);
  });

  it('应对大数组正确排序', () => {
    const arr = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
    const expected = [...arr].sort((a, b) => a - b);
    expect(quickSort(arr)).toEqual(expected);
  });
});
`,
  }),
};

const mergeSortTemplate: AlgorithmTemplate = {
  name: '归并排序',
  keywords: ['归并排序', 'merge sort', 'mergesort', 'merge'],
  category: '排序',
  complexity: { time: 'O(n log n)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 归并排序 (Merge Sort)
 *
 * 算法思想: 采用分治策略，将数组递归地分成两半，分别排序后再合并。
 * 合并过程是核心：比较两个有序子数组的元素，依次取出较小者。
 *
 * 时间复杂度: O(n log n) - 所有情况
 * 空间复杂度: O(n) - 需要额外的合并空间
 * 稳定性: 稳定排序
 *
 * @param arr - 待排序的数字数组
 * @returns 排序后的新数组（升序）
 */
export function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return [...arr];
  }

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

/**
 * 合并两个有序数组
 */
function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0;
  let j = 0;

  // 比较两个数组的元素，取较小者
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  // 将剩余元素追加到结果
  return [...result, ...left.slice(i), ...right.slice(j)];
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { mergeSort } from './${taskName}.js';

describe('${taskName} - 归并排序', () => {
  it('应对空数组返回空数组', () => {
    expect(mergeSort([])).toEqual([]);
  });

  it('应对单元素数组返回自身', () => {
    expect(mergeSort([42])).toEqual([42]);
  });

  it('应对乱序数组正确排序', () => {
    expect(mergeSort([38, 27, 43, 3, 9, 82, 10])).toEqual([3, 9, 10, 27, 38, 43, 82]);
  });

  it('应对已排序数组保持顺序', () => {
    expect(mergeSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it('应对含重复元素的数组正确排序', () => {
    expect(mergeSort([5, 2, 5, 1, 2, 3])).toEqual([1, 2, 2, 3, 5, 5]);
  });

  it('应对大数组正确排序', () => {
    const arr = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 10000));
    const expected = [...arr].sort((a, b) => a - b);
    expect(mergeSort(arr)).toEqual(expected);
  });
});
`,
  }),
};

const heapSortTemplate: AlgorithmTemplate = {
  name: '堆排序',
  keywords: ['堆排序', 'heap sort', 'heapsort', 'heap'],
  category: '排序',
  complexity: { time: 'O(n log n)', space: 'O(1)' },
  generate: (taskName: string) => ({
    code: `/**
 * 堆排序 (Heap Sort)
 *
 * 算法思想: 利用最大堆的性质进行排序。
 * 1. 将数组构建为最大堆
 * 2. 将堆顶（最大值）与末尾元素交换
 * 3. 缩小堆的范围，对新的堆顶进行下沉操作
 * 4. 重复直到堆为空
 *
 * 时间复杂度: O(n log n) - 所有情况
 * 空间复杂度: O(1) - 原地排序
 * 稳定性: 不稳定排序
 *
 * @param arr - 待排序的数字数组
 * @returns 排序后的新数组（升序）
 */
export function heapSort(arr: number[]): number[] {
  if (arr.length <= 1) {
    return [...arr];
  }

  const result = [...arr];
  const n = result.length;

  // 构建最大堆：从最后一个非叶子节点开始
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(result, n, i);
  }

  // 逐个提取堆顶元素
  for (let i = n - 1; i > 0; i--) {
    // 将堆顶（最大值）移到数组末尾
    [result[0], result[i]] = [result[i], result[0]];
    // 对剩余元素重新堆化
    heapify(result, i, 0);
  }

  return result;
}

/**
 * 堆化操作：将以 i 为根的子树调整为最大堆
 *
 * @param arr - 数组
 * @param n - 堆的大小
 * @param i - 当前节点的索引
 */
function heapify(arr: number[], n: number, i: number): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  // 找出当前节点、左子节点、右子节点中的最大值
  if (left < n && arr[left] > arr[largest]) {
    largest = left;
  }

  if (right < n && arr[right] > arr[largest]) {
    largest = right;
  }

  // 如果最大值不是当前节点，交换并继续堆化
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { heapSort } from './${taskName}.js';

describe('${taskName} - 堆排序', () => {
  it('应对空数组返回空数组', () => {
    expect(heapSort([])).toEqual([]);
  });

  it('应对单元素数组返回自身', () => {
    expect(heapSort([42])).toEqual([42]);
  });

  it('应对乱序数组正确排序', () => {
    expect(heapSort([12, 11, 13, 5, 6, 7])).toEqual([5, 6, 7, 11, 12, 13]);
  });

  it('应对已排序数组保持顺序', () => {
    expect(heapSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it('应对含重复元素的数组正确排序', () => {
    expect(heapSort([4, 10, 3, 5, 1, 10, 3])).toEqual([1, 3, 3, 4, 5, 10, 10]);
  });

  it('应对大数组正确排序', () => {
    const arr = Array.from({ length: 500 }, () => Math.floor(Math.random() * 5000));
    const expected = [...arr].sort((a, b) => a - b);
    expect(heapSort(arr)).toEqual(expected);
  });
});
`,
  }),
};

// ==================== 搜索算法 ====================

const linearSearchTemplate: AlgorithmTemplate = {
  name: '线性搜索',
  keywords: ['线性搜索', 'linear search', 'linear', '顺序搜索'],
  category: '搜索',
  complexity: { time: 'O(n)', space: 'O(1)' },
  generate: (taskName: string) => ({
    code: `/**
 * 线性搜索 (Linear Search)
 *
 * 算法思想: 从数组的第一个元素开始，逐个与目标值比较，直到找到匹配项或遍历完整个数组。
 *
 * 时间复杂度: O(n) - 最坏和平均情况; O(1) - 最好情况（第一个元素）
 * 空间复杂度: O(1)
 *
 * @param arr - 待搜索的数组
 * @param target - 目标值
 * @returns 目标值的索引，未找到返回 -1
 */
export function linearSearch<T>(arr: T[], target: T): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

/**
 * 线性搜索 - 查找所有匹配项
 *
 * @param arr - 待搜索的数组
 * @param target - 目标值
 * @returns 所有匹配项的索引数组
 */
export function linearSearchAll<T>(arr: T[], target: T): number[] {
  const indices: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      indices.push(i);
    }
  }
  return indices;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { linearSearch, linearSearchAll } from './${taskName}.js';

describe('${taskName} - 线性搜索', () => {
  it('应找到存在的元素', () => {
    expect(linearSearch([10, 20, 30, 40, 50], 30)).toBe(2);
  });

  it('应对不存在的元素返回 -1', () => {
    expect(linearSearch([10, 20, 30, 40, 50], 99)).toBe(-1);
  });

  it('应处理空数组', () => {
    expect(linearSearch([], 1)).toBe(-1);
  });

  it('应找到第一个匹配的元素', () => {
    expect(linearSearch([1, 2, 3, 2, 1], 2)).toBe(1);
  });

  describe('linearSearchAll', () => {
    it('应找到所有匹配项', () => {
      expect(linearSearchAll([1, 2, 3, 2, 1], 2)).toEqual([1, 3]);
    });

    it('应对不存在的元素返回空数组', () => {
      expect(linearSearchAll([1, 2, 3], 99)).toEqual([]);
    });
  });
});
`,
  }),
};

const binarySearchTemplate: AlgorithmTemplate = {
  name: '二分搜索',
  keywords: ['二分搜索', '二分查找', 'binary search', 'binary', '二分'],
  category: '搜索',
  complexity: { time: 'O(log n)', space: 'O(1)' },
  generate: (taskName: string) => ({
    code: `/**
 * 二分搜索 (Binary Search)
 *
 * 算法思想: 在有序数组中，通过比较中间元素与目标值，每次将搜索范围缩小一半。
 * 前提条件：数组必须是有序的。
 *
 * 时间复杂度: O(log n)
 * 空间复杂度: O(1) - 迭代实现
 *
 * @param arr - 已排序的数字数组（升序）
 * @param target - 目标值
 * @returns 目标值的索引，未找到返回 -1
 */
export function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    // 使用位运算避免整数溢出
    const mid = left + ((right - left) >> 1);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

/**
 * 二分搜索 - 递归实现
 *
 * @param arr - 已排序的数字数组（升序）
 * @param target - 目标值
 * @param left - 搜索范围左边界
 * @param right - 搜索范围右边界
 * @returns 目标值的索引，未找到返回 -1
 */
export function binarySearchRecursive(
  arr: number[],
  target: number,
  left = 0,
  right = arr.length - 1
): number {
  if (left > right) {
    return -1;
  }

  const mid = left + ((right - left) >> 1);

  if (arr[mid] === target) {
    return mid;
  } else if (arr[mid] < target) {
    return binarySearchRecursive(arr, target, mid + 1, right);
  } else {
    return binarySearchRecursive(arr, target, left, mid - 1);
  }
}

/**
 * 二分搜索 - 找到第一个等于目标值的元素（适用于含重复元素的数组）
 *
 * @param arr - 已排序的数字数组（升序）
 * @param target - 目标值
 * @returns 第一个匹配的索引，未找到返回 -1
 */
export function binarySearchFirst(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = left + ((right - left) >> 1);

    if (arr[mid] === target) {
      result = mid;
      right = mid - 1; // 继续向左搜索
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { binarySearch, binarySearchRecursive, binarySearchFirst } from './${taskName}.js';

describe('${taskName} - 二分搜索', () => {
  const sortedArr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

  it('应找到存在的元素', () => {
    expect(binarySearch(sortedArr, 7)).toBe(3);
  });

  it('应对不存在的元素返回 -1', () => {
    expect(binarySearch(sortedArr, 8)).toBe(-1);
  });

  it('应处理空数组', () => {
    expect(binarySearch([], 1)).toBe(-1);
  });

  it('应找到第一个元素', () => {
    expect(binarySearch(sortedArr, 1)).toBe(0);
  });

  it('应找到最后一个元素', () => {
    expect(binarySearch(sortedArr, 19)).toBe(9);
  });

  describe('递归版本', () => {
    it('应与迭代版本结果一致', () => {
      expect(binarySearchRecursive(sortedArr, 7)).toBe(3);
      expect(binarySearchRecursive(sortedArr, 8)).toBe(-1);
    });
  });

  describe('binarySearchFirst', () => {
    it('应找到重复元素的第一个位置', () => {
      const arr = [1, 2, 2, 2, 3, 4];
      expect(binarySearchFirst(arr, 2)).toBe(1);
    });
  });
});
`,
  }),
};

const bfsTemplate: AlgorithmTemplate = {
  name: '广度优先搜索',
  keywords: ['广度优先搜索', 'BFS', 'breadth first search', '广度优先', '宽度优先'],
  category: '搜索',
  complexity: { time: 'O(V + E)', space: 'O(V)' },
  generate: (taskName: string) => ({
    code: `/**
 * 广度优先搜索 (BFS - Breadth-First Search)
 *
 * 算法思想: 从起始节点开始，先访问所有相邻节点，再访问相邻节点的相邻节点。
 * 使用队列实现层级遍历。
 *
 * 时间复杂度: O(V + E) - V 为顶点数，E 为边数
 * 空间复杂度: O(V) - 队列和访问记录
 *
 * 适用场景: 最短路径（无权图）、层级遍历、连通性检测
 */

/** 邻接表表示的图 */
export type Graph = Map<number, number[]>;

/**
 * 从邻接表构建图
 *
 * @param edges - 边的数组，每条边为 [from, to]
 * @param directed - 是否为有向图，默认 false
 * @returns 图的邻接表
 */
export function buildGraph(edges: [number, number][], directed = false): Graph {
  const graph: Graph = new Map();

  for (const [from, to] of edges) {
    if (!graph.has(from)) graph.set(from, []);
    if (!graph.has(to)) graph.set(to, []);
    graph.get(from)!.push(to);
    if (!directed) {
      graph.get(to)!.push(from);
    }
  }

  return graph;
}

/**
 * 广度优先搜索
 *
 * @param graph - 图的邻接表
 * @param start - 起始节点
 * @returns BFS 遍历顺序的节点数组
 */
export function bfs(graph: Graph, start: number): number[] {
  const visited = new Set<number>();
  const queue: number[] = [start];
  const result: number[] = [];

  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}

/**
 * BFS 求最短路径（无权图）
 *
 * @param graph - 图的邻接表
 * @param start - 起始节点
 * @param end - 目标节点
 * @returns 从 start 到 end 的最短路径节点数组，不可达返回 null
 */
export function bfsShortestPath(graph: Graph, start: number, end: number): number[] | null {
  const visited = new Set<number>();
  const queue: number[] = [start];
  const parent = new Map<number, number | null>();
  parent.set(start, null);
  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift()!;

    if (node === end) {
      // 回溯路径
      const path: number[] = [];
      let current: number | null = end;
      while (current !== null) {
        path.unshift(current);
        current = parent.get(current) ?? null;
      }
      return path;
    }

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, node);
        queue.push(neighbor);
      }
    }
  }

  return null;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { buildGraph, bfs, bfsShortestPath } from './${taskName}.js';

describe('${taskName} - 广度优先搜索', () => {
  const edges: [number, number][] = [
    [1, 2], [1, 3], [2, 4], [2, 5], [3, 6], [3, 7],
  ];
  const graph = buildGraph(edges);

  it('应按层级顺序遍历图', () => {
    const result = bfs(graph, 1);
    // 层级: [1], [2, 3], [4, 5, 6, 7]
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('应处理不连通的图', () => {
    const result = bfs(graph, 1);
    expect(result).not.toContain(8);
  });

  it('应处理单节点图', () => {
    const singleGraph = buildGraph([]);
    expect(bfs(singleGraph, 1)).toEqual([1]);
  });

  describe('bfsShortestPath', () => {
    it('应找到最短路径', () => {
      const path = bfsShortestPath(graph, 1, 5);
      expect(path).toEqual([1, 2, 5]);
    });

    it('应对不可达节点返回 null', () => {
      const path = bfsShortestPath(graph, 1, 99);
      expect(path).toBeNull();
    });

    it('应对相同节点返回单元素路径', () => {
      const path = bfsShortestPath(graph, 1, 1);
      expect(path).toEqual([1]);
    });
  });
});
`,
  }),
};

const dfsTemplate: AlgorithmTemplate = {
  name: '深度优先搜索',
  keywords: ['深度优先搜索', 'DFS', 'depth first search', '深度优先'],
  category: '搜索',
  complexity: { time: 'O(V + E)', space: 'O(V)' },
  generate: (taskName: string) => ({
    code: `/**
 * 深度优先搜索 (DFS - Depth-First Search)
 *
 * 算法思想: 从起始节点开始，沿着一条路径尽可能深地探索，直到无法继续时回溯。
 * 使用栈（递归调用栈或显式栈）实现。
 *
 * 时间复杂度: O(V + E) - V 为顶点数，E 为边数
 * 空间复杂度: O(V) - 递归栈或显式栈
 *
 * 适用场景: 路径查找、拓扑排序、连通分量、回溯问题
 */

/** 邻接表表示的图 */
export type Graph = Map<number, number[]>;

/**
 * 从邻接表构建图
 *
 * @param edges - 边的数组，每条边为 [from, to]
 * @param directed - 是否为有向图，默认 false
 * @returns 图的邻接表
 */
export function buildGraph(edges: [number, number][], directed = false): Graph {
  const graph: Graph = new Map();

  for (const [from, to] of edges) {
    if (!graph.has(from)) graph.set(from, []);
    if (!graph.has(to)) graph.set(to, []);
    graph.get(from)!.push(to);
    if (!directed) {
      graph.get(to)!.push(from);
    }
  }

  return graph;
}

/**
 * 深度优先搜索 - 递归实现
 *
 * @param graph - 图的邻接表
 * @param start - 起始节点
 * @returns DFS 遍历顺序的节点数组
 */
export function dfs(graph: Graph, start: number): number[] {
  const visited = new Set<number>();
  const result: number[] = [];

  function traverse(node: number): void {
    visited.add(node);
    result.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        traverse(neighbor);
      }
    }
  }

  traverse(start);
  return result;
}

/**
 * 深度优先搜索 - 迭代实现
 *
 * @param graph - 图的邻接表
 * @param start - 起始节点
 * @returns DFS 遍历顺序的节点数组
 */
export function dfsIterative(graph: Graph, start: number): number[] {
  const visited = new Set<number>();
  const stack: number[] = [start];
  const result: number[] = [];

  while (stack.length > 0) {
    const node = stack.pop()!;

    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);

    // 反向压入邻居，保证遍历顺序与递归一致
    const neighbors = (graph.get(node) || []).slice().reverse();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  return result;
}

/**
 * DFS 检测图中是否存在路径
 *
 * @param graph - 图的邻接表
 * @param start - 起始节点
 * @param end - 目标节点
 * @returns 是否存在从 start 到 end 的路径
 */
export function hasPath(graph: Graph, start: number, end: number): boolean {
  const visited = new Set<number>();

  function traverse(node: number): boolean {
    if (node === end) return true;
    visited.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor) && traverse(neighbor)) {
        return true;
      }
    }

    return false;
  }

  return traverse(start);
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { buildGraph, dfs, dfsIterative, hasPath } from './${taskName}.js';

describe('${taskName} - 深度优先搜索', () => {
  const edges: [number, number][] = [
    [1, 2], [1, 3], [2, 4], [2, 5], [3, 6], [3, 7],
  ];
  const graph = buildGraph(edges);

  it('应深度优先遍历图', () => {
    const result = dfs(graph, 1);
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result).toContain(3);
    expect(result).toContain(4);
    expect(result).toContain(5);
    expect(result).toContain(6);
    expect(result).toContain(7);
    expect(result.length).toBe(7);
  });

  it('迭代版本应与递归版本访问相同节点', () => {
    const recursiveResult = dfs(graph, 1);
    const iterativeResult = dfsIterative(graph, 1);
    expect(new Set(iterativeResult)).toEqual(new Set(recursiveResult));
  });

  it('应处理单节点图', () => {
    const singleGraph = buildGraph([]);
    expect(dfs(singleGraph, 1)).toEqual([1]);
  });

  describe('hasPath', () => {
    it('应检测到存在的路径', () => {
      expect(hasPath(graph, 1, 7)).toBe(true);
    });

    it('应对不可达节点返回 false', () => {
      expect(hasPath(graph, 1, 99)).toBe(false);
    });

    it('应对相同节点返回 true', () => {
      expect(hasPath(graph, 1, 1)).toBe(true);
    });
  });
});
`,
  }),
};

// ==================== 数据结构 ====================

const linkedListTemplate: AlgorithmTemplate = {
  name: '链表',
  keywords: ['链表', 'linked list', 'linkedlist', '单链表', '双向链表'],
  category: '数据结构',
  complexity: { time: 'O(n)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 单向链表 (Singly Linked List)
 *
 * 数据结构: 每个节点包含数据和指向下一个节点的指针。
 *
 * 时间复杂度:
 * - 访问: O(n)
 * - 搜索: O(n)
 * - 插入: O(1) (已知位置) / O(n) (按值)
 * - 删除: O(1) (已知位置) / O(n) (按值)
 *
 * 空间复杂度: O(n)
 */

/** 链表节点 */
export class ListNode<T> {
  value: T;
  next: ListNode<T> | null;

  constructor(value: T, next: ListNode<T> | null = null) {
    this.value = value;
    this.next = next;
  }
}

/** 单向链表 */
export class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private _size = 0;

  /** 获取链表长度 */
  get size(): number {
    return this._size;
  }

  /** 在链表头部插入节点 */
  prepend(value: T): void {
    this.head = new ListNode(value, this.head);
    this._size++;
  }

  /** 在链表尾部插入节点 */
  append(value: T): void {
    const newNode = new ListNode(value);

    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = newNode;
    }

    this._size++;
  }

  /** 在指定位置插入节点 */
  insertAt(index: number, value: T): boolean {
    if (index < 0 || index > this._size) {
      return false;
    }

    if (index === 0) {
      this.prepend(value);
      return true;
    }

    const newNode = new ListNode(value);
    let current = this.head;
    for (let i = 0; i < index - 1; i++) {
      current = current!.next;
    }

    newNode.next = current!.next;
    current!.next = newNode;
    this._size++;
    return true;
  }

  /** 删除指定位置的节点 */
  removeAt(index: number): T | null {
    if (index < 0 || index >= this._size) {
      return null;
    }

    if (index === 0) {
      const value = this.head!.value;
      this.head = this.head!.next;
      this._size--;
      return value;
    }

    let current = this.head;
    for (let i = 0; i < index - 1; i++) {
      current = current!.next;
    }

    const removed = current!.next!;
    current!.next = removed.next;
    this._size--;
    return removed.value;
  }

  /** 查找指定值的索引 */
  indexOf(value: T): number {
    let current = this.head;
    let index = 0;

    while (current) {
      if (current.value === value) {
        return index;
      }
      current = current.next;
      index++;
    }

    return -1;
  }

  /** 转换为数组 */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;

    while (current) {
      result.push(current.value);
      current = current.next;
    }

    return result;
  }

  /** 反转链表 */
  reverse(): void {
    let prev: ListNode<T> | null = null;
    let current = this.head;

    while (current) {
      const next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }

    this.head = prev;
  }

  /** 清空链表 */
  clear(): void {
    this.head = null;
    this._size = 0;
  }
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { LinkedList, ListNode } from './${taskName}.js';

describe('${taskName} - 单向链表', () => {
  let list: LinkedList<number>;

  beforeEach(() => {
    list = new LinkedList<number>();
  });

  it('应正确创建空链表', () => {
    expect(list.size).toBe(0);
    expect(list.toArray()).toEqual([]);
  });

  it('应在头部插入元素', () => {
    list.prepend(3);
    list.prepend(2);
    list.prepend(1);
    expect(list.toArray()).toEqual([1, 2, 3]);
    expect(list.size).toBe(3);
  });

  it('应在尾部插入元素', () => {
    list.append(1);
    list.append(2);
    list.append(3);
    expect(list.toArray()).toEqual([1, 2, 3]);
  });

  it('应在指定位置插入元素', () => {
    list.append(1);
    list.append(3);
    list.insertAt(1, 2);
    expect(list.toArray()).toEqual([1, 2, 3]);
  });

  it('应删除指定位置的元素', () => {
    list.append(1);
    list.append(2);
    list.append(3);
    expect(list.removeAt(1)).toBe(2);
    expect(list.toArray()).toEqual([1, 3]);
  });

  it('应正确查找元素索引', () => {
    list.append(10);
    list.append(20);
    list.append(30);
    expect(list.indexOf(20)).toBe(1);
    expect(list.indexOf(99)).toBe(-1);
  });

  it('应正确反转链表', () => {
    list.append(1);
    list.append(2);
    list.append(3);
    list.reverse();
    expect(list.toArray()).toEqual([3, 2, 1]);
  });

  it('应正确清空链表', () => {
    list.append(1);
    list.append(2);
    list.clear();
    expect(list.size).toBe(0);
    expect(list.toArray()).toEqual([]);
  });
});
`,
  }),
};

const stackTemplate: AlgorithmTemplate = {
  name: '栈',
  keywords: ['栈', 'stack', '堆栈', '后进先出', 'LIFO'],
  category: '数据结构',
  complexity: { time: 'O(1)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 栈 (Stack) - 后进先出 (LIFO)
 *
 * 数据结构: 只允许在一端（栈顶）进行插入和删除操作的线性数据结构。
 *
 * 时间复杂度:
 * - 入栈 (push): O(1)
 * - 出栈 (pop): O(1)
 * - 查看栈顶 (peek): O(1)
 * - 判空 (isEmpty): O(1)
 *
 * 空间复杂度: O(n)
 *
 * 适用场景: 函数调用栈、表达式求值、括号匹配、撤销操作
 */
export class Stack<T> {
  private items: T[] = [];

  /** 入栈 - 将元素压入栈顶 */
  push(item: T): void {
    this.items.push(item);
  }

  /** 出栈 - 移除并返回栈顶元素 */
  pop(): T | undefined {
    return this.items.pop();
  }

  /** 查看栈顶元素但不移除 */
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /** 栈是否为空 */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** 获取栈的大小 */
  get size(): number {
    return this.items.length;
  }

  /** 清空栈 */
  clear(): void {
    this.items = [];
  }

  /** 转换为数组（从栈底到栈顶） */
  toArray(): T[] {
    return [...this.items];
  }
}

/**
 * 使用栈实现括号匹配检测
 *
 * @param str - 包含括号的字符串
 * @returns 括号是否匹配
 */
export function isValidParentheses(str: string): boolean {
  const stack = new Stack<string>();
  const pairs: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
  };
  const openBrackets = new Set(['(', '[', '{']);

  for (const char of str) {
    if (openBrackets.has(char)) {
      stack.push(char);
    } else if (char in pairs) {
      const top = stack.pop();
      if (top !== pairs[char]) {
        return false;
      }
    }
  }

  return stack.isEmpty();
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { Stack, isValidParentheses } from './${taskName}.js';

describe('${taskName} - 栈', () => {
  let stack: Stack<number>;

  beforeEach(() => {
    stack = new Stack<number>();
  });

  it('应正确创建空栈', () => {
    expect(stack.isEmpty()).toBe(true);
    expect(stack.size).toBe(0);
  });

  it('应正确入栈和出栈', () => {
    stack.push(1);
    stack.push(2);
    stack.push(3);
    expect(stack.pop()).toBe(3);
    expect(stack.pop()).toBe(2);
    expect(stack.pop()).toBe(1);
  });

  it('应正确查看栈顶元素', () => {
    stack.push(10);
    stack.push(20);
    expect(stack.peek()).toBe(20);
    expect(stack.size).toBe(2);
  });

  it('空栈出栈应返回 undefined', () => {
    expect(stack.pop()).toBeUndefined();
  });

  it('应正确转换为数组', () => {
    stack.push(1);
    stack.push(2);
    stack.push(3);
    expect(stack.toArray()).toEqual([1, 2, 3]);
  });

  it('应正确清空栈', () => {
    stack.push(1);
    stack.push(2);
    stack.clear();
    expect(stack.isEmpty()).toBe(true);
  });

  describe('isValidParentheses', () => {
    it('应对匹配的括号返回 true', () => {
      expect(isValidParentheses('()')).toBe(true);
      expect(isValidParentheses('()[]{}')).toBe(true);
      expect(isValidParentheses('{[()]}')).toBe(true);
    });

    it('应对不匹配的括号返回 false', () => {
      expect(isValidParentheses('(]')).toBe(false);
      expect(isValidParentheses('([)]')).toBe(false);
      expect(isValidParentheses('(')).toBe(false);
    });
  });
});
`,
  }),
};

const queueTemplate: AlgorithmTemplate = {
  name: '队列',
  keywords: ['队列', 'queue', '先进先出', 'FIFO'],
  category: '数据结构',
  complexity: { time: 'O(1)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 队列 (Queue) - 先进先出 (FIFO)
 *
 * 数据结构: 在一端（队尾）插入，在另一端（队头）删除的线性数据结构。
 *
 * 时间复杂度:
 * - 入队 (enqueue): O(1)
 * - 出队 (dequeue): O(1)
 * - 查看队头 (front): O(1)
 * - 判空 (isEmpty): O(1)
 *
 * 空间复杂度: O(n)
 *
 * 适用场景: 任务调度、消息队列、BFS、缓冲区
 */
export class Queue<T> {
  private items: T[] = [];

  /** 入队 - 将元素添加到队尾 */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /** 出队 - 移除并返回队头元素 */
  dequeue(): T | undefined {
    return this.items.shift();
  }

  /** 查看队头元素但不移除 */
  front(): T | undefined {
    return this.items[0];
  }

  /** 队列是否为空 */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** 获取队列的大小 */
  get size(): number {
    return this.items.length;
  }

  /** 清空队列 */
  clear(): void {
    this.items = [];
  }

  /** 转换为数组（从队头到队尾） */
  toArray(): T[] {
    return [...this.items];
  }
}

/**
 * 使用数组实现循环队列
 */
export class CircularQueue<T> {
  private items: (T | undefined)[];
  private capacity: number;
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.items = new Array(capacity);
  }

  /** 入队 */
  enqueue(item: T): boolean {
    if (this.isFull()) {
      return false;
    }
    this.items[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }

  /** 出队 */
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const item = this.items[this.head];
    this.items[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  /** 查看队头 */
  front(): T | undefined {
    return this.items[this.head];
  }

  /** 队列是否为空 */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /** 队列是否已满 */
  isFull(): boolean {
    return this.count === this.capacity;
  }

  /** 获取队列大小 */
  get size(): number {
    return this.count;
  }
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { Queue, CircularQueue } from './${taskName}.js';

describe('${taskName} - 队列', () => {
  let queue: Queue<number>;

  beforeEach(() => {
    queue = new Queue<number>();
  });

  it('应正确创建空队列', () => {
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size).toBe(0);
  });

  it('应正确入队和出队', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    expect(queue.dequeue()).toBe(1);
    expect(queue.dequeue()).toBe(2);
    expect(queue.dequeue()).toBe(3);
  });

  it('应正确查看队头元素', () => {
    queue.enqueue(10);
    queue.enqueue(20);
    expect(queue.front()).toBe(10);
    expect(queue.size).toBe(2);
  });

  it('空队列出队应返回 undefined', () => {
    expect(queue.dequeue()).toBeUndefined();
  });

  it('应正确转换为数组', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    expect(queue.toArray()).toEqual([1, 2, 3]);
  });

  describe('CircularQueue', () => {
    it('应正确入队和出队', () => {
      const cq = new CircularQueue<number>(3);
      expect(cq.enqueue(1)).toBe(true);
      expect(cq.enqueue(2)).toBe(true);
      expect(cq.enqueue(3)).toBe(true);
      expect(cq.isFull()).toBe(true);
      expect(cq.enqueue(4)).toBe(false);
      expect(cq.dequeue()).toBe(1);
      expect(cq.enqueue(4)).toBe(true);
    });
  });
});
`,
  }),
};

const hashMapTemplate: AlgorithmTemplate = {
  name: '哈希表',
  keywords: ['哈希表', 'hash table', 'hashtable', 'hash map', 'hashmap', '哈希', '散列'],
  category: '数据结构',
  complexity: { time: 'O(1)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 哈希表 (Hash Table / Hash Map)
 *
 * 数据结构: 通过哈希函数将键映射到存储位置，实现快速查找。
 * 使用链地址法处理冲突。
 *
 * 时间复杂度（平均）:
 * - 插入: O(1)
 * - 查找: O(1)
 * - 删除: O(1)
 *
 * 时间复杂度（最坏）: O(n) - 所有键冲突时
 * 空间复杂度: O(n)
 */

/** 哈希表条目 */
interface HashEntry<K, V> {
  key: K;
  value: V;
}

/**
 * 简易哈希表实现
 */
export class HashMap<K, V> {
  private buckets: Array<Array<HashEntry<K, V>>>;
  private capacity: number;
  private _size = 0;

  constructor(initialCapacity = 16) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: initialCapacity }, () => []);
  }

  /** 哈希函数 */
  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为 32 位整数
    }
    return Math.abs(hash) % this.capacity;
  }

  /** 设置键值对 */
  set(key: K, value: V): void {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    // 检查是否已存在该键
    for (const entry of bucket) {
      if (entry.key === key) {
        entry.value = value;
        return;
      }
    }

    bucket.push({ key, value });
    this._size++;
  }

  /** 获取值 */
  get(key: K): V | undefined {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    for (const entry of bucket) {
      if (entry.key === key) {
        return entry.value;
      }
    }

    return undefined;
  }

  /** 删除键值对 */
  delete(key: K): boolean {
    const index = this.hash(key);
    const bucket = this.buckets[index];

    const entryIndex = bucket.findIndex(entry => entry.key === key);
    if (entryIndex !== -1) {
      bucket.splice(entryIndex, 1);
      this._size--;
      return true;
    }

    return false;
  }

  /** 是否包含某个键 */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /** 获取哈希表大小 */
  get size(): number {
    return this._size;
  }

  /** 是否为空 */
  isEmpty(): boolean {
    return this._size === 0;
  }

  /** 获取所有键 */
  keys(): K[] {
    const result: K[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push(entry.key);
      }
    }
    return result;
  }

  /** 获取所有值 */
  values(): V[] {
    const result: V[] = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) {
        result.push(entry.value);
      }
    }
    return result;
  }

  /** 清空哈希表 */
  clear(): void {
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this._size = 0;
  }
}

/**
 * 使用哈希表统计字符频率
 *
 * @param str - 输入字符串
 * @returns 字符频率映射
 */
export function charFrequency(str: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  return freq;
}

/**
 * 两数之和 - 使用哈希表
 *
 * @param nums - 数字数组
 * @param target - 目标和
 * @returns 两个数的索引，未找到返回 null
 */
export function twoSum(nums: number[], target: number): [number, number] | null {
  const map = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }

  return null;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { HashMap, charFrequency, twoSum } from './${taskName}.js';

describe('${taskName} - 哈希表', () => {
  let map: HashMap<string, number>;

  beforeEach(() => {
    map = new HashMap<string, number>();
  });

  it('应正确设置和获取值', () => {
    map.set('a', 1);
    map.set('b', 2);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  it('应对不存在的键返回 undefined', () => {
    expect(map.get('nonexistent')).toBeUndefined();
  });

  it('应正确更新已存在的键', () => {
    map.set('a', 1);
    map.set('a', 100);
    expect(map.get('a')).toBe(100);
    expect(map.size).toBe(1);
  });

  it('应正确删除键值对', () => {
    map.set('a', 1);
    expect(map.delete('a')).toBe(true);
    expect(map.get('a')).toBeUndefined();
    expect(map.delete('a')).toBe(false);
  });

  it('应正确判断键是否存在', () => {
    map.set('key', 42);
    expect(map.has('key')).toBe(true);
    expect(map.has('other')).toBe(false);
  });

  it('应正确获取所有键和值', () => {
    map.set('x', 10);
    map.set('y', 20);
    map.set('z', 30);
    expect(map.keys().sort()).toEqual(['x', 'y', 'z']);
    expect(map.values().sort()).toEqual([10, 20, 30]);
  });

  describe('charFrequency', () => {
    it('应正确统计字符频率', () => {
      const freq = charFrequency('hello');
      expect(freq.get('h')).toBe(1);
      expect(freq.get('e')).toBe(1);
      expect(freq.get('l')).toBe(2);
      expect(freq.get('o')).toBe(1);
    });
  });

  describe('twoSum', () => {
    it('应找到两数之和的索引', () => {
      expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
    });

    it('应对无解情况返回 null', () => {
      expect(twoSum([1, 2, 3], 100)).toBeNull();
    });
  });
});
`,
  }),
};

const binaryTreeTemplate: AlgorithmTemplate = {
  name: '二叉树',
  keywords: ['二叉树', 'binary tree', 'binarytree', '树', 'tree'],
  category: '数据结构',
  complexity: { time: 'O(n)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 二叉树 (Binary Tree)
 *
 * 数据结构: 每个节点最多有两个子节点（左子节点和右子节点）的树结构。
 *
 * 遍历方式:
 * - 前序遍历 (Pre-order): 根 -> 左 -> 右
 * - 中序遍历 (In-order): 左 -> 根 -> 右
 * - 后序遍历 (Post-order): 左 -> 右 -> 根
 * - 层序遍历 (Level-order): 逐层从左到右
 *
 * 时间复杂度: O(n) - 遍历所有节点
 * 空间复杂度: O(n) - 最坏情况（树退化为链表）
 */

/** 二叉树节点 */
export class TreeNode<T> {
  value: T;
  left: TreeNode<T> | null;
  right: TreeNode<T> | null;

  constructor(value: T, left: TreeNode<T> | null = null, right: TreeNode<T> | null = null) {
    this.value = value;
    this.left = left;
    this.right = right;
  }
}

/** 二叉树 */
export class BinaryTree<T> {
  root: TreeNode<T> | null = null;

  constructor(root: TreeNode<T> | null = null) {
    this.root = root;
  }

  /** 前序遍历 - 递归 */
  preOrder(): T[] {
    const result: T[] = [];
    function traverse(node: TreeNode<T> | null): void {
      if (!node) return;
      result.push(node.value);
      traverse(node.left);
      traverse(node.right);
    }
    traverse(this.root);
    return result;
  }

  /** 中序遍历 - 递归 */
  inOrder(): T[] {
    const result: T[] = [];
    function traverse(node: TreeNode<T> | null): void {
      if (!node) return;
      traverse(node.left);
      result.push(node.value);
      traverse(node.right);
    }
    traverse(this.root);
    return result;
  }

  /** 后序遍历 - 递归 */
  postOrder(): T[] {
    const result: T[] = [];
    function traverse(node: TreeNode<T> | null): void {
      if (!node) return;
      traverse(node.left);
      traverse(node.right);
      result.push(node.value);
    }
    traverse(this.root);
    return result;
  }

  /** 层序遍历 - 使用队列 */
  levelOrder(): T[][] {
    if (!this.root) return [];

    const result: T[][] = [];
    const queue: Array<TreeNode<T> | null> = [this.root];

    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLevel: T[] = [];

      for (let i = 0; i < levelSize; i++) {
        const node = queue.shift()!;
        currentLevel.push(node.value);

        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }

      result.push(currentLevel);
    }

    return result;
  }

  /** 获取树的高度 */
  getHeight(): number {
    function height(node: TreeNode<T> | null): number {
      if (!node) return 0;
      return 1 + Math.max(height(node.left), height(node.right));
    }
    return height(this.root);
  }

  /** 获取节点总数 */
  getNodeCount(): number {
    function count(node: TreeNode<T> | null): number {
      if (!node) return 0;
      return 1 + count(node.left) + count(node.right);
    }
    return count(this.root);
  }
}

/**
 * 从数组构建二叉树（层序）
 * 数组中的 null 表示该位置没有节点
 *
 * @param arr - 层序表示的数组
 * @returns 二叉树的根节点
 */
export function buildTreeFromArray<T>(arr: Array<T | null>): TreeNode<T> | null {
  if (arr.length === 0 || arr[0] === null) return null;

  const root = new TreeNode(arr[0] as T);
  const queue: TreeNode<T>[] = [root];
  let i = 1;

  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift()!;

    // 左子节点
    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i] as T);
      queue.push(node.left);
    }
    i++;

    // 右子节点
    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i] as T);
      queue.push(node.right);
    }
    i++;
  }

  return root;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { TreeNode, BinaryTree, buildTreeFromArray } from './${taskName}.js';

describe('${taskName} - 二叉树', () => {
  it('应正确进行前序遍历', () => {
    //     1
    //    / \\
    //   2   3
    //  / \\
    // 4   5
    const tree = new BinaryTree(
      new TreeNode(1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3)
      )
    );
    expect(tree.preOrder()).toEqual([1, 2, 4, 5, 3]);
  });

  it('应正确进行中序遍历', () => {
    const tree = new BinaryTree(
      new TreeNode(1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3)
      )
    );
    expect(tree.inOrder()).toEqual([4, 2, 5, 1, 3]);
  });

  it('应正确进行后序遍历', () => {
    const tree = new BinaryTree(
      new TreeNode(1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3)
      )
    );
    expect(tree.postOrder()).toEqual([4, 5, 2, 3, 1]);
  });

  it('应正确进行层序遍历', () => {
    const tree = new BinaryTree(
      new TreeNode(1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3)
      )
    );
    expect(tree.levelOrder()).toEqual([[1], [2, 3], [4, 5]]);
  });

  it('应正确计算树的高度', () => {
    const tree = new BinaryTree(
      new TreeNode(1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3)
      )
    );
    expect(tree.getHeight()).toBe(3);
  });

  it('应正确计算节点总数', () => {
    const tree = new BinaryTree(
      new TreeNode(1,
        new TreeNode(2, new TreeNode(4), new TreeNode(5)),
        new TreeNode(3)
      )
    );
    expect(tree.getNodeCount()).toBe(5);
  });

  it('应从数组正确构建二叉树', () => {
    const root = buildTreeFromArray([1, 2, 3, 4, 5]);
    const tree = new BinaryTree(root);
    expect(tree.levelOrder()).toEqual([[1], [2, 3], [4, 5]]);
  });
});
`,
  }),
};

// ==================== 动态规划 ====================

const fibonacciTemplate: AlgorithmTemplate = {
  name: '斐波那契数列',
  keywords: ['斐波那契', 'fibonacci', 'fib'],
  category: '动态规划',
  complexity: { time: 'O(n)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 斐波那契数列 (Fibonacci Sequence) - 动态规划
 *
 * 定义: F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2) (n >= 2)
 *
 * 方法1 - 带备忘录的递归（自顶向下）:
 *   时间复杂度: O(n), 空间复杂度: O(n)
 *
 * 方法2 - 迭代法（自底向上）:
 *   时间复杂度: O(n), 空间复杂度: O(1)
 *
 * 方法3 - 矩阵快速幂:
 *   时间复杂度: O(log n), 空间复杂度: O(1)
 */

/**
 * 斐波那契数列 - 带备忘录的递归
 *
 * @param n - 第 n 个斐波那契数
 * @returns 第 n 个斐波那契数的值
 */
export function fibonacciMemo(n: number): number {
  if (n <= 1) return n;

  const memo: number[] = new Array(n + 1).fill(-1);
  memo[0] = 0;
  memo[1] = 1;

  function fib(i: number): number {
    if (memo[i] !== -1) return memo[i];
    memo[i] = fib(i - 1) + fib(i - 2);
    return memo[i];
  }

  return fib(n);
}

/**
 * 斐波那契数列 - 迭代法（空间优化）
 *
 * @param n - 第 n 个斐波那契数
 * @returns 第 n 个斐波那契数的值
 */
export function fibonacciIterative(n: number): number {
  if (n <= 1) return n;

  let prev2 = 0; // F(n-2)
  let prev1 = 1; // F(n-1)

  for (let i = 2; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}

/**
 * 斐波那契数列 - 返回整个序列
 *
 * @param n - 返回前 n+1 个斐波那契数
 * @returns 斐波那契数列数组
 */
export function fibonacciSequence(n: number): number[] {
  if (n <= 0) return [0];
  if (n === 1) return [0, 1];

  const seq: number[] = [0, 1];
  for (let i = 2; i <= n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }

  return seq;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { fibonacciMemo, fibonacciIterative, fibonacciSequence } from './${taskName}.js';

describe('${taskName} - 斐波那契数列', () => {
  it('应正确计算 F(0)', () => {
    expect(fibonacciMemo(0)).toBe(0);
    expect(fibonacciIterative(0)).toBe(0);
  });

  it('应正确计算 F(1)', () => {
    expect(fibonacciMemo(1)).toBe(1);
    expect(fibonacciIterative(1)).toBe(1);
  });

  it('应正确计算 F(10)', () => {
    expect(fibonacciMemo(10)).toBe(55);
    expect(fibonacciIterative(10)).toBe(55);
  });

  it('应正确计算 F(20)', () => {
    expect(fibonacciMemo(20)).toBe(6765);
    expect(fibonacciIterative(20)).toBe(6765);
  });

  it('两种方法结果应一致', () => {
    for (let i = 0; i <= 30; i++) {
      expect(fibonacciMemo(i)).toBe(fibonacciIterative(i));
    }
  });

  describe('fibonacciSequence', () => {
    it('应返回正确的序列', () => {
      expect(fibonacciSequence(10)).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55]);
    });

    it('应处理 n=0 的情况', () => {
      expect(fibonacciSequence(0)).toEqual([0]);
    });
  });
});
`,
  }),
};

const knapsackTemplate: AlgorithmTemplate = {
  name: '背包问题',
  keywords: ['背包', 'knapsack', '0-1背包', '01背包'],
  category: '动态规划',
  complexity: { time: 'O(n * W)', space: 'O(n * W)' },
  generate: (taskName: string) => ({
    code: `/**
 * 0-1 背包问题 (0-1 Knapsack Problem) - 动态规划
 *
 * 问题描述: 给定 n 个物品，每个物品有重量和价值，在背包容量为 W 的情况下，
 * 选择物品使总价值最大。每个物品只能选一次。
 *
 * 状态转移方程:
 *   dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i])  (w >= weight[i])
 *   dp[i][w] = dp[i-1][w]                                        (w < weight[i])
 *
 * 时间复杂度: O(n * W) - n 为物品数，W 为背包容量
 * 空间复杂度: O(n * W) - 可优化为 O(W)
 */

/** 物品定义 */
export interface Item {
  weight: number;
  value: number;
  name?: string;
}

/** 背包问题结果 */
export interface KnapsackResult {
  maxValue: number;
  selectedItems: Item[];
  selectedIndices: number[];
}

/**
 * 0-1 背包问题 - 二维 DP
 *
 * @param items - 物品数组
 * @param capacity - 背包容量
 * @returns 最大价值和选中的物品
 */
export function knapsack01(items: Item[], capacity: number): KnapsackResult {
  const n = items.length;
  // dp[i][w] 表示前 i 个物品、容量为 w 时的最大价值
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );

  // 填充 DP 表
  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1];
    for (let w = 0; w <= capacity; w++) {
      if (weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // 回溯找出选中的物品
  const selectedItems: Item[] = [];
  const selectedIndices: number[] = [];
  let w = capacity;

  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedItems.push(items[i - 1]);
      selectedIndices.push(i - 1);
      w -= items[i - 1].weight;
    }
  }

  return {
    maxValue: dp[n][capacity],
    selectedItems: selectedItems.reverse(),
    selectedIndices: selectedIndices.reverse(),
  };
}

/**
 * 0-1 背包问题 - 空间优化版本
 *
 * @param items - 物品数组
 * @param capacity - 背包容量
 * @returns 最大价值
 */
export function knapsack01Optimized(items: Item[], capacity: number): number {
  const dp: number[] = new Array(capacity + 1).fill(0);

  for (const { weight, value } of items) {
    // 从后向前遍历，避免重复选择
    for (let w = capacity; w >= weight; w--) {
      dp[w] = Math.max(dp[w], dp[w - weight] + value);
    }
  }

  return dp[capacity];
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { knapsack01, knapsack01Optimized } from './${taskName}.js';
import type { Item } from './${taskName}.js';

describe('${taskName} - 0-1 背包问题', () => {
  it('应正确求解简单背包问题', () => {
    const items: Item[] = [
      { weight: 1, value: 1 },
      { weight: 2, value: 6 },
      { weight: 3, value: 10 },
      { weight: 2, value: 7 },
    ];
    const result = knapsack01(items, 5);
    expect(result.maxValue).toBe(17); // 物品2 + 物品4
  });

  it('应正确回溯选中的物品', () => {
    const items: Item[] = [
      { weight: 2, value: 3, name: 'A' },
      { weight: 3, value: 4, name: 'B' },
      { weight: 4, value: 5, name: 'C' },
      { weight: 5, value: 6, name: 'D' },
    ];
    const result = knapsack01(items, 5);
    expect(result.maxValue).toBe(7); // A + B
    expect(result.selectedItems.length).toBe(2);
  });

  it('应处理容量为 0 的情况', () => {
    const items: Item[] = [{ weight: 1, value: 10 }];
    const result = knapsack01(items, 0);
    expect(result.maxValue).toBe(0);
    expect(result.selectedItems).toEqual([]);
  });

  it('应处理空物品列表', () => {
    const result = knapsack01([], 10);
    expect(result.maxValue).toBe(0);
  });

  it('优化版本应与标准版本结果一致', () => {
    const items: Item[] = [
      { weight: 2, value: 3 },
      { weight: 3, value: 4 },
      { weight: 4, value: 5 },
      { weight: 5, value: 8 },
      { weight: 1, value: 2 },
    ];
    for (let cap = 0; cap <= 15; cap++) {
      expect(knapsack01Optimized(items, cap)).toBe(knapsack01(items, cap).maxValue);
    }
  });
});
`,
  }),
};

const longestSubsequenceTemplate: AlgorithmTemplate = {
  name: '最长子序列',
  keywords: ['最长子序列', 'LCS', 'longest common subsequence', '最长公共子序列', 'LIS', 'longest increasing subsequence', '最长递增子序列'],
  category: '动态规划',
  complexity: { time: 'O(n * m)', space: 'O(n * m)' },
  generate: (taskName: string) => ({
    code: `/**
 * 最长公共子序列 (Longest Common Subsequence, LCS) - 动态规划
 *
 * 问题描述: 给定两个字符串，找到它们的最长公共子序列的长度。
 * 子序列不需要连续，但需要保持相对顺序。
 *
 * 状态转移方程:
 *   如果 text1[i-1] === text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
 *   否则: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
 *
 * 时间复杂度: O(n * m) - n 和 m 分别为两个字符串的长度
 * 空间复杂度: O(n * m) - 可优化为 O(min(n, m))
 */

/**
 * 最长公共子序列 - 返回长度
 *
 * @param text1 - 第一个字符串
 * @param text2 - 第二个字符串
 * @returns LCS 的长度
 */
export function lcsLength(text1: string, text2: string): number {
  const m = text1.length;
  const n = text2.length;

  // dp[i][j] 表示 text1[0..i-1] 和 text2[0..j-1] 的 LCS 长度
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * 最长公共子序列 - 返回具体的子序列
 *
 * @param text1 - 第一个字符串
 * @param text2 - 第二个字符串
 * @returns LCS 字符串
 */
export function lcs(text1: string, text2: string): string {
  const m = text1.length;
  const n = text2.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  // 填充 DP 表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯构建 LCS
  const result: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (text1[i - 1] === text2[j - 1]) {
      result.push(text1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result.reverse().join('');
}

/**
 * 最长递增子序列 (Longest Increasing Subsequence, LIS) - 动态规划
 *
 * 时间复杂度: O(n^2)
 * 空间复杂度: O(n)
 *
 * @param nums - 数字数组
 * @returns LIS 的长度
 */
export function lisLength(nums: number[]): number {
  if (nums.length === 0) return 0;

  // dp[i] 表示以 nums[i] 结尾的 LIS 长度
  const dp: number[] = new Array(nums.length).fill(1);
  let maxLen = 1;

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
    maxLen = Math.max(maxLen, dp[i]);
  }

  return maxLen;
}

/**
 * 最长递增子序列 - 返回具体序列
 *
 * @param nums - 数字数组
 * @returns LIS 数组
 */
export function lis(nums: number[]): number[] {
  if (nums.length === 0) return [];

  const dp: number[] = new Array(nums.length).fill(1);
  const parent: number[] = new Array(nums.length).fill(-1);
  let maxLen = 1;
  let maxIndex = 0;

  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        parent[i] = j;
      }
    }
    if (dp[i] > maxLen) {
      maxLen = dp[i];
      maxIndex = i;
    }
  }

  // 回溯构建 LIS
  const result: number[] = [];
  let current = maxIndex;
  while (current !== -1) {
    result.unshift(nums[current]);
    current = parent[current];
  }

  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { lcsLength, lcs, lisLength, lis } from './${taskName}.js';

describe('${taskName} - 最长子序列', () => {
  describe('LCS', () => {
    it('应正确计算 LCS 长度', () => {
      expect(lcsLength('abcde', 'ace')).toBe(3);
      expect(lcsLength('abc', 'abc')).toBe(3);
      expect(lcsLength('abc', 'def')).toBe(0);
    });

    it('应正确返回 LCS 字符串', () => {
      expect(lcs('abcde', 'ace')).toBe('ace');
      expect(lcs('AGGTAB', 'GXTXAYB')).toBe('GTAB');
    });

    it('应处理空字符串', () => {
      expect(lcsLength('', 'abc')).toBe(0);
      expect(lcs('', '')).toBe('');
    });
  });

  describe('LIS', () => {
    it('应正确计算 LIS 长度', () => {
      expect(lisLength([10, 9, 2, 5, 3, 7, 101, 18])).toBe(4);
      expect(lisLength([0, 1, 0, 3, 2, 3])).toBe(4);
      expect(lisLength([7, 7, 7, 7, 7, 7, 7])).toBe(1);
    });

    it('应正确返回 LIS 序列', () => {
      expect(lis([10, 9, 2, 5, 3, 7, 101, 18])).toEqual([2, 3, 7, 101]);
    });

    it('应处理空数组', () => {
      expect(lisLength([])).toBe(0);
      expect(lis([])).toEqual([]);
    });
  });
});
`,
  }),
};

// ==================== 其他算法 ====================

const recursionTemplate: AlgorithmTemplate = {
  name: '递归',
  keywords: ['递归', 'recursion', '阶乘', 'factorial', '汉诺塔', 'hanoi', 'tower of hanoi'],
  category: '递归',
  complexity: { time: 'O(n)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 递归算法示例
 *
 * 递归三要素:
 * 1. 终止条件（Base Case）
 * 2. 递归调用（向终止条件逼近）
 * 3. 当前层的处理逻辑
 */

/**
 * 阶乘 - 经典递归示例
 *
 * 定义: n! = n * (n-1) * ... * 2 * 1, 0! = 1
 * 时间复杂度: O(n)
 * 空间复杂度: O(n) - 递归调用栈
 *
 * @param n - 非负整数
 * @returns n 的阶乘
 */
export function factorial(n: number): number {
  // 终止条件
  if (n <= 1) return 1;
  // 递归调用
  return n * factorial(n - 1);
}

/**
 * 阶乘 - 尾递归优化
 *
 * @param n - 非负整数
 * @param accumulator - 累积器
 * @returns n 的阶乘
 */
export function factorialTailRecursive(n: number, accumulator = 1): number {
  if (n <= 1) return accumulator;
  return factorialTailRecursive(n - 1, n * accumulator);
}

/**
 * 汉诺塔 (Tower of Hanoi)
 *
 * 问题描述: 将 n 个盘子从起始柱移动到目标柱，每次只能移动一个盘子，
 * 且大盘子不能放在小盘子上面。
 *
 * 时间复杂度: O(2^n)
 * 空间复杂度: O(n) - 递归调用栈
 *
 * @param n - 盘子数量
 * @param from - 起始柱名称
 * @param to - 目标柱名称
 * @param aux - 辅助柱名称
 * @returns 移动步骤数组
 */
export function hanoi(n: number, from = 'A', to = 'C', aux = 'B'): string[] {
  const moves: string[] = [];

  function move(disks: number, source: string, target: string, auxiliary: string): void {
    // 终止条件：只剩一个盘子
    if (disks === 1) {
      moves.push(\`\${source} -> \${target}\`);
      return;
    }

    // 将 n-1 个盘子从 source 移到 auxiliary（借助 target）
    move(disks - 1, source, auxiliary, target);

    // 将第 n 个盘子从 source 移到 target
    moves.push(\`\${source} -> \${target}\`);

    // 将 n-1 个盘子从 auxiliary 移到 target（借助 source）
    move(disks - 1, auxiliary, target, source);
  }

  move(n, from, to, aux);
  return moves;
}

/**
 * 全排列 - 递归实现
 *
 * 时间复杂度: O(n!)
 * 空间复杂度: O(n)
 *
 * @param arr - 输入数组
 * @returns 所有可能的排列
 */
export function permutations<T>(arr: T[]): T[][] {
  const result: T[][] = [];

  function backtrack(current: T[], remaining: T[]): void {
    // 终止条件：没有剩余元素
    if (remaining.length === 0) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i]);
      backtrack(current, [...remaining.slice(0, i), ...remaining.slice(i + 1)]);
      current.pop();
    }
  }

  backtrack([], arr);
  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { factorial, factorialTailRecursive, hanoi, permutations } from './${taskName}.js';

describe('${taskName} - 递归算法', () => {
  describe('阶乘', () => {
    it('应正确计算 0!', () => {
      expect(factorial(0)).toBe(1);
    });

    it('应正确计算 1!', () => {
      expect(factorial(1)).toBe(1);
    });

    it('应正确计算 5!', () => {
      expect(factorial(5)).toBe(120);
    });

    it('应正确计算 10!', () => {
      expect(factorial(10)).toBe(3628800);
    });

    it('尾递归版本应与普通版本结果一致', () => {
      for (let i = 0; i <= 15; i++) {
        expect(factorialTailRecursive(i)).toBe(factorial(i));
      }
    });
  });

  describe('汉诺塔', () => {
    it('应正确求解 1 个盘子', () => {
      expect(hanoi(1)).toEqual(['A -> C']);
    });

    it('应正确求解 2 个盘子', () => {
      expect(hanoi(2)).toEqual(['A -> B', 'A -> C', 'B -> C']);
    });

    it('应正确求解 3 个盘子', () => {
      const moves = hanoi(3);
      expect(moves.length).toBe(7); // 2^3 - 1
      expect(moves[moves.length - 1]).toBe('A -> C');
    });

    it('移动次数应为 2^n - 1', () => {
      for (let n = 1; n <= 5; n++) {
        expect(hanoi(n).length).toBe(Math.pow(2, n) - 1);
      }
    });
  });

  describe('全排列', () => {
    it('应正确生成 [1,2,3] 的全排列', () => {
      const result = permutations([1, 2, 3]);
      expect(result.length).toBe(6);
      expect(result).toContainEqual([1, 2, 3]);
      expect(result).toContainEqual([1, 3, 2]);
      expect(result).toContainEqual([2, 1, 3]);
      expect(result).toContainEqual([2, 3, 1]);
      expect(result).toContainEqual([3, 1, 2]);
      expect(result).toContainEqual([3, 2, 1]);
    });

    it('应正确处理单元素数组', () => {
      expect(permutations([1])).toEqual([[1]]);
    });

    it('应正确处理空数组', () => {
      expect(permutations([])).toEqual([[]]);
    });
  });
});
`,
  }),
};

const backtrackingTemplate: AlgorithmTemplate = {
  name: '回溯',
  keywords: ['回溯', 'backtracking', 'N皇后', 'n-queens', '子集', 'subset', '组合', 'combination'],
  category: '回溯',
  complexity: { time: 'O(n!)', space: 'O(n)' },
  generate: (taskName: string) => ({
    code: `/**
 * 回溯算法 (Backtracking)
 *
 * 核心思想: 通过探索所有可能的候选解来找出所有的解，如果发现当前路径
 * 不可能产生有效解，就回退到上一步尝试其他选择。
 *
 * 回溯模板:
 *   function backtrack(路径, 选择列表):
 *     if 满足结束条件:
 *       结果.add(路径)
 *       return
 *     for 选择 in 选择列表:
 *       做选择
 *       backtrack(路径, 选择列表)
 *       撤销选择
 */

/**
 * N 皇后问题 (N-Queens)
 *
 * 问题描述: 在 n x n 的棋盘上放置 n 个皇后，使其不能互相攻击。
 * 皇后可以攻击同一行、同一列、同一对角线上的其他皇后。
 *
 * 时间复杂度: O(n!)
 * 空间复杂度: O(n)
 *
 * @param n - 棋盘大小
 * @returns 所有的解（每个解是棋盘的字符串表示数组）
 */
export function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const board: string[][] = Array.from({ length: n }, () => new Array(n).fill('.'));

  function isValid(row: number, col: number): boolean {
    // 检查同一列
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;
    }

    // 检查左上对角线
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 'Q') return false;
    }

    // 检查右上对角线
    for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 'Q') return false;
    }

    return true;
  }

  function backtrack(row: number): void {
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }

    for (let col = 0; col < n; col++) {
      if (isValid(row, col)) {
        board[row][col] = 'Q';  // 做选择
        backtrack(row + 1);      // 递归
        board[row][col] = '.';  // 撤销选择
      }
    }
  }

  backtrack(0);
  return result;
}

/**
 * 生成所有子集
 *
 * 时间复杂度: O(2^n)
 * 空间复杂度: O(n)
 *
 * @param nums - 输入数组
 * @returns 所有可能的子集
 */
export function subsets<T>(nums: T[]): T[][] {
  const result: T[][] = [];

  function backtrack(start: number, current: T[]): void {
    result.push([...current]);

    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]);     // 做选择
      backtrack(i + 1, current);  // 递归
      current.pop();             // 撤销选择
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * 组合 - 从 n 个数中选 k 个
 *
 * 时间复杂度: O(C(n, k))
 * 空间复杂度: O(k)
 *
 * @param n - 从 1 到 n
 * @param k - 选 k 个数
 * @returns 所有可能的组合
 */
export function combine(n: number, k: number): number[][] {
  const result: number[][] = [];

  function backtrack(start: number, current: number[]): void {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    // 剪枝：剩余元素不够时提前返回
    const remaining = n - start + 1;
    const needed = k - current.length;
    if (remaining < needed) return;

    for (let i = start; i <= n; i++) {
      current.push(i);           // 做选择
      backtrack(i + 1, current);  // 递归
      current.pop();             // 撤销选择
    }
  }

  backtrack(1, []);
  return result;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { solveNQueens, subsets, combine } from './${taskName}.js';

describe('${taskName} - 回溯算法', () => {
  describe('N 皇后', () => {
    it('应正确求解 1 皇后', () => {
      const solutions = solveNQueens(1);
      expect(solutions.length).toBe(1);
      expect(solutions[0]).toEqual(['Q']);
    });

    it('应正确求解 4 皇后', () => {
      const solutions = solveNQueens(4);
      expect(solutions.length).toBe(2);
    });

    it('应正确求解 8 皇后', () => {
      const solutions = solveNQueens(8);
      expect(solutions.length).toBe(92);
    });

    it('每个解应有 n 个皇后', () => {
      const solutions = solveNQueens(5);
      for (const solution of solutions) {
        const queenCount = solution.reduce((sum, row) => sum + (row.match(/Q/g) || []).length, 0);
        expect(queenCount).toBe(5);
      }
    });
  });

  describe('子集', () => {
    it('应生成所有子集', () => {
      const result = subsets([1, 2, 3]);
      expect(result.length).toBe(8); // 2^3
      expect(result).toContainEqual([]);
      expect(result).toContainEqual([1]);
      expect(result).toContainEqual([2]);
      expect(result).toContainEqual([3]);
      expect(result).toContainEqual([1, 2]);
      expect(result).toContainEqual([1, 3]);
      expect(result).toContainEqual([2, 3]);
      expect(result).toContainEqual([1, 2, 3]);
    });

    it('空数组应返回包含空集的数组', () => {
      expect(subsets([])).toEqual([[]]);
    });
  });

  describe('组合', () => {
    it('应正确生成 C(4, 2) 的组合', () => {
      const result = combine(4, 2);
      expect(result.length).toBe(6);
      expect(result).toContainEqual([1, 2]);
      expect(result).toContainEqual([1, 3]);
      expect(result).toContainEqual([1, 4]);
      expect(result).toContainEqual([2, 3]);
      expect(result).toContainEqual([2, 4]);
      expect(result).toContainEqual([3, 4]);
    });

    it('应正确处理 k=0 的情况', () => {
      expect(combine(5, 0)).toEqual([[]]);
    });

    it('应正确处理 k=n 的情况', () => {
      expect(combine(3, 3)).toEqual([[1, 2, 3]]);
    });
  });
});
`,
  }),
};

const greedyTemplate: AlgorithmTemplate = {
  name: '贪心算法',
  keywords: ['贪心', 'greedy', '跳跃游戏', 'jump game', '分发糖果', 'candy', '区间', 'interval'],
  category: '贪心',
  complexity: { time: 'O(n)', space: 'O(1)' },
  generate: (taskName: string) => ({
    code: `/**
 * 贪心算法 (Greedy Algorithm)
 *
 * 核心思想: 每一步都做出当前看来最优的选择，期望通过局部最优达到全局最优。
 * 注意: 贪心算法不一定能得到全局最优解，需要证明贪心选择性质。
 */

/**
 * 跳跃游戏 - 判断是否能到达最后一个位置
 *
 * 问题描述: 给定一个非负整数数组，每个元素表示在该位置可以跳跃的最大步数。
 * 判断是否能从第一个位置跳到最后一个位置。
 *
 * 时间复杂度: O(n)
 * 空间复杂度: O(1)
 *
 * @param nums - 跳跃步数数组
 * @returns 是否能到达最后一个位置
 */
export function canJump(nums: number[]): boolean {
  let maxReach = 0;

  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }

  return true;
}

/**
 * 跳跃游戏 II - 最少跳跃次数
 *
 * 时间复杂度: O(n)
 * 空间复杂度: O(1)
 *
 * @param nums - 跳跃步数数组
 * @returns 最少跳跃次数
 */
export function jump(nums: number[]): number {
  if (nums.length <= 1) return 0;

  let jumps = 0;
  let currentEnd = 0;
  let farthest = 0;

  for (let i = 0; i < nums.length - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]);

    if (i === currentEnd) {
      jumps++;
      currentEnd = farthest;

      if (currentEnd >= nums.length - 1) break;
    }
  }

  return jumps;
}

/**
 * 分发糖果 - 贪心策略
 *
 * 问题描述: 每个孩子至少分到 1 个糖果，评分更高的孩子比相邻孩子获得更多糖果。
 *
 * 时间复杂度: O(n)
 * 空间复杂度: O(n)
 *
 * @param ratings - 孩子评分数组
 * @returns 最少需要的糖果数
 */
export function candy(ratings: number[]): number {
  const n = ratings.length;
  const candies = new Array(n).fill(1);

  // 从左到右：右边的孩子评分更高则多给一个
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) {
      candies[i] = candies[i - 1] + 1;
    }
  }

  // 从右到左：左边的孩子评分更高则多给一个
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) {
      candies[i] = Math.max(candies[i], candies[i + 1] + 1);
    }
  }

  return candies.reduce((sum, c) => sum + c, 0);
}

/**
 * 区间调度 - 最多不重叠区间数
 *
 * 问题描述: 给定一组区间，找到最多数量的不重叠区间。
 * 贪心策略: 按结束时间排序，每次选择结束时间最早的区间。
 *
 * 时间复杂度: O(n log n)
 * 空间复杂度: O(1)
 *
 * @param intervals - 区间数组 [[start, end], ...]
 * @returns 最多不重叠区间数
 */
export function maxNonOverlappingIntervals(intervals: [number, number][]): number {
  if (intervals.length === 0) return 0;

  // 按结束时间排序
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);

  let count = 1;
  let lastEnd = sorted[0][1];

  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    if (start >= lastEnd) {
      count++;
      lastEnd = end;
    }
  }

  return count;
}
`,
    test: `import { describe, it, expect } from 'vitest';
import { canJump, jump, candy, maxNonOverlappingIntervals } from './${taskName}.js';

describe('${taskName} - 贪心算法', () => {
  describe('canJump', () => {
    it('应对可到达的情况返回 true', () => {
      expect(canJump([2, 3, 1, 1, 4])).toBe(true);
    });

    it('应对不可到达的情况返回 false', () => {
      expect(canJump([3, 2, 1, 0, 4])).toBe(false);
    });

    it('应处理单元素数组', () => {
      expect(canJump([0])).toBe(true);
    });
  });

  describe('jump', () => {
    it('应返回最少跳跃次数', () => {
      expect(jump([2, 3, 1, 1, 4])).toBe(2);
    });

    it('应处理单元素数组', () => {
      expect(jump([0])).toBe(0);
    });

    it('应处理两元素数组', () => {
      expect(jump([1, 1])).toBe(1);
    });
  });

  describe('candy', () => {
    it('应正确分发糖果', () => {
      expect(candy([1, 0, 2])).toBe(5);
    });

    it('应处理递增评分', () => {
      expect(candy([1, 2, 3])).toBe(6);
    });

    it('应处理相同评分', () => {
      expect(candy([1, 1, 1])).toBe(3);
    });

    it('应处理复杂评分', () => {
      expect(candy([1, 3, 2, 2, 1])).toBe(7);
    });
  });

  describe('maxNonOverlappingIntervals', () => {
    it('应返回最多不重叠区间数', () => {
      const intervals: [number, number][] = [[1, 2], [2, 3], [3, 4], [1, 3]];
      expect(maxNonOverlappingIntervals(intervals)).toBe(3);
    });

    it('应处理空数组', () => {
      expect(maxNonOverlappingIntervals([])).toBe(0);
    });

    it('应处理完全重叠的区间', () => {
      const intervals: [number, number][] = [[1, 5], [2, 4], [3, 6]];
      expect(maxNonOverlappingIntervals(intervals)).toBe(1);
    });
  });
});
`,
  }),
};

// ==================== 模板注册表 ====================

const ALGORITHM_TEMPLATES: AlgorithmTemplate[] = [
  // 排序
  bubbleSortTemplate,
  selectionSortTemplate,
  insertionSortTemplate,
  quickSortTemplate,
  mergeSortTemplate,
  heapSortTemplate,
  // 搜索
  linearSearchTemplate,
  binarySearchTemplate,
  bfsTemplate,
  dfsTemplate,
  // 数据结构
  linkedListTemplate,
  stackTemplate,
  queueTemplate,
  hashMapTemplate,
  binaryTreeTemplate,
  // 动态规划
  fibonacciTemplate,
  knapsackTemplate,
  longestSubsequenceTemplate,
  // 其他
  recursionTemplate,
  backtrackingTemplate,
  greedyTemplate,
];

/**
 * 根据描述文本匹配最合适的算法模板
 *
 * @param description - 任务描述文本
 * @returns 匹配到的算法模板，未匹配返回 null
 */
export function getAlgorithmTemplate(description: string): AlgorithmTemplate | null {
  const lowerDesc = description.toLowerCase();

  // 精确匹配关键词
  let bestMatch: AlgorithmTemplate | null = null;
  let bestScore = 0;

  for (const template of ALGORITHM_TEMPLATES) {
    let score = 0;

    for (const keyword of template.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerDesc.includes(lowerKeyword)) {
        // 关键词越长，匹配权重越高
        score += lowerKeyword.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }

  return bestMatch;
}

/**
 * 使用模板生成算法代码和测试
 *
 * @param template - 算法模板
 * @param taskName - 任务名称（用于文件命名）
 * @returns 包含代码和测试内容的对象
 */
export function generateAlgorithmCode(
  template: AlgorithmTemplate,
  taskName: string
): { code: string; test: string } {
  return template.generate(taskName);
}

/**
 * 获取所有可用的算法模板
 *
 * @returns 所有算法模板的名称和分类
 */
export function listAvailableAlgorithms(): Array<{ name: string; category: string; keywords: string[] }> {
  return ALGORITHM_TEMPLATES.map(t => ({
    name: t.name,
    category: t.category,
    keywords: t.keywords,
  }));
}
