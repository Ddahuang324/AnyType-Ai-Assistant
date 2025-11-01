import type { Project, ObjectSet, Space } from '../types';

// --- SETS DEFINITIONS ---
const cppSet: ObjectSet = {
    id: 'set-cpp',
    name: 'C++ Knowledge Base',
    description: 'A structured overview of key C++ concepts and topics.',
    relations: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'type', label: '类型', type: 'status' },
        { key: 'understanding', label: '理解程度', type: 'status' },
        { key: 'difficulty', label: '难度', type: 'status' },
        { key: 'importance', label: '重要性', type: 'status' },
        { key: 'created', label: 'Creation Date', type: 'date' },
        { key: 'opened', label: 'Last Opened', type: 'date' },
    ],
    objects: [
        { id: 'cpp-1', name: '编译器', relations: { type: '框架性知识', understanding: '少半理解', difficulty: '中级', importance: '一般', created: '05.29.2025', opened: '08.26.2025' } },
        { 
            id: 'cpp-2', 
            name: '高级内存管理', 
            relations: { type: '框架性知识', understanding: '少半理解', difficulty: '中级', importance: '重要', created: '04.12.2025', opened: '06.12.2025' },
            children: [
                { id: 'cpp-2-1', name: 'RAII (资源获取即初始化)', relations: { type: '核心原则', understanding: '多半理解', difficulty: '中级', importance: '重要' } },
                { 
                    id: 'cpp-2-2', 
                    name: '智能指针', 
                    relations: { type: '工具', understanding: '少半理解', difficulty: '高级', importance: '重要' },
                    children: [
                        { id: 'cpp-2-2-1', name: 'std::unique_ptr', relations: { type: '具体实现', understanding: '多半理解', difficulty: '中级', importance: '重要' } },
                        { id: 'cpp-2-2-2', name: 'std::shared_ptr', relations: { type: '具体实现', understanding: '少半理解', difficulty: '高级', importance: '重要' } },
                        { id: 'cpp-2-2-3', name: 'std::weak_ptr', relations: { type: '具体实现', understanding: '少半理解', difficulty: '高级', importance: '一般' } },
                    ]
                },
            ]
        },
        { 
            id: 'cpp-3', 
            name: '面向对象编程', 
            relations: { type: '框架性知识', understanding: '多半理解', difficulty: '中级', importance: '重要', created: '04.10.2025', opened: '10.16.2025' },
            children: [
                { id: 'cpp-3-1', name: '封装', relations: { type: '核心概念', understanding: '完全理解', difficulty: '初级', importance: '重要' } },
                { id: 'cpp-3-2', name: '继承', relations: { type: '核心概念', understanding: '多半理解', difficulty: '中级', importance: '重要' } },
                { id: 'cpp-3-3', name: '多态', relations: { type: '核心概念', understanding: '少半理解', difficulty: '高级', importance: '重要' } },
            ]
        },
        { id: 'cpp-4', name: '指针和引用', relations: { type: '框架性知识', understanding: '多半理解', difficulty: '中级', importance: '重要', created: '04.10.2025', opened: '08.26.2025' } },
        { id: 'cpp-5', name: '数据类型', relations: { type: '框架性知识', understanding: '多半理解', difficulty: '初级', importance: '一般', created: '04.10.2025', opened: '08.26.2025' } },
        { id: 'cpp-6', name: '函数', relations: { type: '框架性知识', understanding: '完全理解', difficulty: '初级', importance: '一般', created: '04.09.2025', opened: '08.26.2025' } },
        { id: 'cpp-7', name: 'STL (标准模板库)', relations: { type: '框架性知识', understanding: '少半理解', difficulty: '高级', importance: '重要', created: '05.21.2025', opened: '06.21.2025' } },
    ]
};

const leetcodeSet: ObjectSet = {
    id: 'set-leetcode',
    name: 'LeetCode Problem Tracker',
    description: 'Tracking algorithm and data structure practice problems.',
    relations: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'source', label: '题目来源', type: 'url' },
        { key: 'understanding', label: '理解程度', type: 'status' },
        { key: 'algorithm', label: '算法行为范式', type: 'tag' },
        { key: 'dataStructure', label: '数据结构', type: 'tag' },
        { key: 'timeComplexity', label: '时间...', type: 'status' },
        { key: 'spaceComplexity', label: '空间...', type: 'status' },
    ],
    objects: [
        { id: 'lc-1', name: '704.二分查找', relations: { source: 'https...', understanding: '完全理解', algorithm: ['查找元素'], dataStructure: ['数组'], timeComplexity: 'O(log n)', spaceComplexity: 'O(1)' } },
        { id: 'lc-2', name: '35.搜索插入位置', relations: { source: 'https...', understanding: '多半理解', algorithm: ['查找元素'], dataStructure: ['数组'], timeComplexity: 'O(log n)', spaceComplexity: 'O(1)' } },
        { id: 'lc-3', name: '34.在排序数组中查找元素的位置', relations: { source: 'https..._1', understanding: '完全理解', algorithm: ['查找元素'], dataStructure: ['数组'], timeComplexity: 'O(log n)', spaceComplexity: 'O(1)' } },
        { id: 'lc-4', name: '27.移除元素', relations: { source: 'https..._2', understanding: '多半理解', algorithm: ['移除元素', '双指针'], dataStructure: ['数组'], timeComplexity: 'O(n)', spaceComplexity: 'O(1)' } },
        { id: 'lc-5', name: '26.从排序数组中删除重复项', relations: { source: 'https..._3', understanding: '多半理解', algorithm: ['移除元素', '快慢指针'], dataStructure: ['数组'], timeComplexity: 'O(n)', spaceComplexity: 'O(1)' } },
    ]
};

const defaultSet: ObjectSet = {
    id: 'set-default',
    name: 'Generic Project Space',
    description: 'A default space for your notes and ideas.',
    relations: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'due', label: 'Due Date', type: 'date' },
    ],
    objects: [
        { id: 'def-1', name: 'Initial Brainstorm', relations: { status: 'Completed', due: '10.15.2025' } },
        { id: 'def-2', name: 'Follow up with stakeholders', relations: { status: 'In Progress', due: '11.01.2025' } },
        { id: 'def-3', name: 'Finalize design mockups', relations: { status: 'To Do', due: '11.10.2025' } },
    ]
};

// --- SPACES DEFINITIONS ---

const personalSpace: Space = {
    id: 'space-personal',
    name: 'Personal Knowledge',
    projects: [
        { id: 'p-2', title: 'LeetCode Tracker', description: 'Algorithm Practice', imageUrl: 'https://picsum.photos/600/400?random=2', linkedSetId: 'set-leetcode' },
        { id: 'p-3', title: 'C++ Knowledge Base', description: 'Language Concepts', imageUrl: 'https://picsum.photos/600/400?random=3', linkedSetId: 'set-cpp' },
    ],
    sets: [leetcodeSet, cppSet]
};

const renovationSpace: Space = {
    id: 'space-renovation',
    name: 'Home Renovation',
    projects: [
        { id: 'r-1', title: 'Renovation Moodboard', description: 'Interior Design', imageUrl: 'https://picsum.photos/600/400?random=1', linkedSetId: 'set-default' },
        { id: 'r-2', title: 'Client Meeting Notes', description: 'Client Relations', imageUrl: 'https://picsum.photos/600/400?random=4', linkedSetId: 'set-default' },
        { id: 'r-3', title: 'Exterior Concepts', description: 'Exterior Design', imageUrl: 'https://picsum.photos/600/400?random=5', linkedSetId: 'set-default' },
        { id: 'r-4', title: 'Budget Breakdown', description: 'Finance', imageUrl: 'https://picsum.photos/600/400?random=6', linkedSetId: 'set-default' },
    ],
    sets: [defaultSet]
};

export const MOCK_SPACES: Space[] = [personalSpace, renovationSpace];