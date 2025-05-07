<template>
    <div class="ui-crud">
        <!-- #region 侧边栏 -->
        <slot name="sidebarCard">
            <UiCard v-if="hasProxy('sidebarCard')" class="ui-crud-sidebar-card" body-padding="0 20px 20px" size="large" v-bind="getProxy('sidebarCard').attrs">
                <template v-for="(slotItem, slotName) in getProxy('sidebarCard').slots" :key="slotName" #[slotName]>
                    <component :is="slotItem" />
                </template>
            </UiCard>
        </slot>
        <!-- #endregion -->

        <div class="ui-crud-main">
            <!-- #region 默认插槽 -->
            <slot />
            <!-- #endregion -->
            
            <!-- #region 搜索表单-->
            <slot name="searchCard">
                <UiCard v-if="hasProxy('search')" v-show="tableStore.showSearch" class="ui-crud-search-card" body-padding="20px 20px 2px" v-bind="getProxy('searchCard').attrs">
                    <template v-for="(slotItem, slotName) in Object.assign({ default: null }, getProxy('searchCard').slots || {})" :key="slotName" #[slotName]>
                        <!-- 无default插巢时 -->
                        <template v-if="slotName === 'default' && !slotItem">
                            <UiForm :ref="(value) => initRef(value, getProxy('search'), 'searchFormRef')" v-bind="tableStore.searchBind">
                                <template v-for="(searchSlotItem, searchSlotName) in Object.assign(searchDefaultSlots, getProxy('search').slots)" :key="searchSlotName" #[searchSlotName]="scope">
                                    <!-- controls -->
                                    <template v-if="searchSlotName === 'field_controls' && !searchSlotItem">
                                        <div style="display: flex; white-space: normal">
                                            <el-button type="primary" @click="tableStore.onSearch">搜索</el-button>
                                            <el-button @click="tableStore.onResetSearch">重置</el-button>
                                        </div>
                                    </template>
                                    <component :is="searchSlotItem" v-else v-bind="scope" />
                                </template>
                            </UiForm>
                        </template>
                        <component :is="slotItem" v-else />
                    </template>
                </UiCard>
            </slot>
            <!-- #endregion -->

            <!-- #region table列表 -->
            <slot name="tableCard">
                <UiCard v-if="hasProxy('table') || hasProxy('pagination')" v-loading="tableStore.loading" class="ui-crud-table-card" flex header-padding="14px 20px 7px" body-padding="15px 20px 20px 20px" v-bind="getProxy('tableCard').attrs">
                    <template v-for="(slotItem, slotName) in Object.assign(tableCardDefaultSlots, getProxy('tableCard').slots || {})" :key="slotName" #[slotName]>
                        <!-- 无header插巢时 -->
                        <template v-if="slotName === 'header' && !slotItem">
                            <div class="ui-right-toolbar-wrap">
                                <UiDynComponent v-if="hasProxy('leftToolbar')" class="ui-left-toolbar" v-bind="tableStore.leftToolbarBind">
                                    <template v-for="(tableSlotItem, tableSlotName) in getProxy('leftToolbar').slots" :key="tableSlotName" #[tableSlotName]>
                                        <component :is="tableSlotItem" />
                                    </template>
                                </UiDynComponent>
                                <UiRightToolbar v-if="hasProxy('rightToolbar')" style="margin-left: auto;" v-bind="tableStore.rightToolbarBind" />
                            </div>
                        </template>
                        <!-- 无default插巢时 -->
                        <template v-else-if="slotName === 'default' && !slotItem">
                            <div class="ui-crud-table-wrap">
                                <!-- 列表 -->
                                <slot name="table">
                                    <UiTable v-if="hasProxy('table')" :ref="(value) => initRef(value, getProxy('table'), 'tableRef')" v-bind="tableStore.tableBind">
                                        <template v-for="(tableSlotItem, tableSlotName) in Object.assign(tableDefaultSlots, getProxy('table').slots)" :key="tableSlotName" #[tableSlotName]="scope">
                                            <!-- 修改状态 -->
                                            <template v-if="tableSlotName === 'status' && !tableSlotItem">
                                                <el-switch v-model="scope.row[tableStore.keyConfig.status]" v-bind="updateFunArguments(tableStore.tableStatusBind, scope)" />
                                            </template>
                                            <!-- 更多操作 -->
                                            <template v-if="tableSlotName === 'controls' && !tableSlotItem">
                                                <UiDynComponent v-if="hasProxy('tableControls')" class="ui-table-controls" :scope="scope" v-bind="tableStore.tableControlsBind">
                                                    <template v-for="(tableControlsSlotItem, tableControlsSlotName) in getProxy('tableControls').slots" :key="tableControlsSlotName" #[tableControlsSlotName]>
                                                        <component :is="tableControlsSlotItem" v-bind="scope" />
                                                    </template>
                                                </UiDynComponent>
                                            </template>
                                            <!-- 插槽 -->
                                            <component :is="tableSlotItem" v-else v-bind="scope" />
                                        </template>
                                    </UiTable>
                                </slot>

                                <!-- 分页 -->
                                <slot name="pagination">
                                    <UiPagination v-if="hasProxy('pagination')" v-show="tableStore.paginationBind?.total" v-bind="tableStore.paginationBind" />
                                </slot>
                            </div>
                        </template>
                        <component :is="slotItem" v-else />
                    </template>
                </UiCard>
            </slot>
            <!-- #endregion -->
        </div>

        <UiDrawer v-if="hasProxy('updateDrawer')" v-bind="tableStore.updateDrawerBind">
            <template v-for="(slotItem, slotName) in Object.assign(updateDrawerDefaultSlots, getProxy('updateDrawer').slots)" :key="slotName" #[slotName]>
                <template v-if="slotName === 'default' && !slotItem">
                    <UiForm v-if="hasProxy('updateForm')" :ref="(value) => initRef(value, getProxy('updateForm'), 'updateFormRef')" v-bind="tableStore.updateFormBind">
                        <template v-for="(updateFormSlotItem, updateFormSlotName) in getProxy('updateForm').slots" :key="updateFormSlotName" #[updateFormSlotName]="scope">
                            <component :is="updateFormSlotItem" v-bind="scope" />
                        </template>
                    </UiForm>
                </template>
                <template v-else-if="slotName === 'footer' && !slotItem">
                    <UiDynComponent v-if="hasProxy('updateDrawerFooter')" class="ui-update-drawer-footer" v-bind="tableStore.updateDrawerFooterBind">
                        <template v-for="(updateDrawerFooterSlotItem, updateDrawerFooterSlotName) in getProxy('updateDrawerFooter').slots" :key="updateDrawerFooterSlotName" #[updateDrawerFooterSlotName]>
                            <component :is="updateDrawerFooterSlotItem" />
                        </template>
                    </UiDynComponent>
                </template>
                <component :is="slotItem" v-else />
            </template>
        </UiDrawer>
    </div>
</template>

<script setup>
import useTable from './hooks/useTable'
import { defaultKeyConfig, defaultOptions } from './defaultConfig'
import { validType } from '@/utils/common'

// #region 前置变量
const props = defineProps({
    gutter: {
        type: String,
        default: '20px'
    },
    apis: { // list | details | add | edit | remove
        type: Object,
        default: () => ({})
    },
    keyConfig: {
        type: Object,
        default: () => ({})
    },
    cardRadius: {
        type: String,
        default: '14px'
    },
    sidebarWidth: {
        type: String,
        default: '270px'
    },
    immediate: { // 是否立即请求
        type: Boolean,
        default: true
    },
    options: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits([])

const slots = useSlots();
const searchFormRef = ref();
const tableRef = ref();
const updateFormRef = ref();

function initRef(value, slotProxy, refName) {
    // refName的值，必须在上面定义变量，否则会无限重载
    switch (refName) {
        case 'searchFormRef': searchFormRef.value = value; break;
        case 'tableRef': tableRef.value = value; break;
        case 'updateFormRef': updateFormRef.value = value; break;
        default: break;
    }
    if (slotProxy?.setProxyRef) slotProxy.setProxyRef(value);
}
// #endregion

// #region 搭配UiSlotProxy组件管理插巢，优化组件插巢过多的问题
// 内置代理组件的key，因为代理组件在default插槽内，会存在非内置代理组件的情况，所以需要列出内置代理组件的key，方便管理
// 会按照顺序创建，有排序要求的组件，需要放到后面，否则会报错
const haveProxyKeys = [
    'sidebarCard',
    'searchCard',
    'search',
    'tableCard',
    'table',
    'leftToolbar',
    'rightToolbar', // 依赖table配置，必须放到table后面
    'pagination',
    'tableControls',
    'tableStatus',
    'updateDrawer',
    'updateForm',
    'updateDrawerFooter'
];
// 存储代理数据
const slotsProxy = reactive({});

provide('slotProxyCreate', slotProxyCreate)
provide('slotProxyDestory', slotProxyDestory)

const joinProxyKeys = computed(() => {
    return slots.default?.().reduce((prev, item) => {
        if (haveProxyKeys.includes(item.key)) prev.push(item.key)
        return prev;
    }, []) || []
})

const proxyCreatedAll = computed(() => {
    return joinProxyKeys.value.every(key => key in slotsProxy);
})

/**
 * 初始化, 等待所有代理初始化完成后, 按顺序创建模块
 * isCreatedAll
 * 为false：不需要自己初始化模块，只需要等待其他模块初始化代理完成后，再初始化自身模块
 * 为true后，热更新时，只需要初始化自身模块即可，不需要重新初始化所有模块
*/
const isCreatedAll = ref(false);

watch(proxyCreatedAll, (newVal) => {
    if (newVal) createModules()
}, { once: true })

// 是否存在代理
function hasProxy(name) {
    return name in slotsProxy;
}

// 创建插槽代理
const awaitCreateKeys = reactive([]);
function slotProxyCreate(name, ctx) {
    slotsProxy[name] = ctx;

    // 首次初始化，无需执行后续操作proxyCreated
    if (!isCreatedAll.value) return;

    // 最后一个初始化完成后，排序创建proxyCreated
    awaitCreateKeys.push(name);
    if (proxyCreatedAll.value) {
        const res = sortProxyKeys(awaitCreateKeys);

        res.forEach((key, index) => {
            proxyCreated(key, false);
            awaitCreateKeys.splice(index, 1);
        })
    }
}

// 销毁插槽代理
function slotProxyDestory(name) {
    if (!slotsProxy[name]) return;
    delete slotsProxy[name]

    proxyDestroyed(name)
}
// 获取代理数据
function getProxy(name) {
    return slotsProxy[name] || {};
}
function proxyCreated(name, isValid = true) {
    if (isValid && !isCreatedAll.value) return;
    
    const handleKey = {
        table: tableCreated,
        search: searchCreated,
        pagination: paginationCreated,
        rightToolbar: rightToolbarCreated,
        leftToolbar: leftToolbarCreated,
        tableControls: tableControlsCreated,
        tableStatus: tableStatusCreated,
        updateDrawer: updateDrawerCreated,
        updateDrawerFooter: updateDrawerFooterCreated,
        updateForm: updateFormCreated
    }

    handleKey[name]?.()
}

function proxyDestroyed(name) {
    const handleKey = {
        search: searchDestroy,
        leftToolbar: leftToolbarDestroy,
        rightToolbar: rightToolbarDestroy,
        tableControls: tableControlsDestroy,
        tableStatus: tableStatusDestroy,
        updateDrawerFooter: updateDrawerFooterDestroy
    }
    
    handleKey[name]?.()

    if (tableStore[`${name}Bind`]) delete tableStore[`${name}Bind`];
}
// #endregion

// #region 初始化useTable
const tableStore = useTable({
    props,
    emit,
    keyConfig: { ...defaultKeyConfig, ...props.keyConfig },
    defaultOptions: {...defaultOptions, ...props.options},
    slotsProxy,
});

// 意思是, 你不使用这些插巢, 它也需要定义出来, 渲染默认元素
const searchDefaultSlots = ref({})
const tableCardDefaultSlots = ref({ default: null })
const tableDefaultSlots = ref({})
const updateDrawerDefaultSlots = ref({ default: null })

// 代理创建完成 (ps: 并非渲染完成)
function createModules() {
    const _joinProxyKeys = sortProxyKeys(joinProxyKeys.value);

    _joinProxyKeys.forEach(key => {
        proxyCreated(key, false);
    })
    
    isCreatedAll.value = true;

    if (props.immediate && joinProxyKeys.value.includes('table')) tableStore.updateList();
}

// 根据haveProxyKeys位置排序
function sortProxyKeys(keys) {
    return haveProxyKeys.reduce((prev, item) => {
        if (keys.includes(item)) prev.push(item)
        return prev;
    }, []) || []
}

function tableCreated() {
    tableStore.addTable(tableRef);
}

function tableControlsCreated() {
    tableDefaultSlots.value.controls = null 
    tableStore.addTableControls();
}

function tableControlsDestroy() {
    delete tableDefaultSlots.value.controls;
}

function tableStatusCreated() {
    tableDefaultSlots.value.status = null;
    tableStore.addTableStatus();
}

function tableStatusDestroy() {
    delete tableDefaultSlots.value.status;
}

function searchCreated() {
    tableStore.addSearch({
        searchFormRef,
    });

    const hasSearchControls = tableStore.searchBind.options?.find(item => item.prop === 'controls' && item.fieldType)

    if (!hasSearchControls) {
        searchDefaultSlots.value['field_controls'] = null;
    }
}

function searchDestroy() {
    delete searchDefaultSlots.value['field_controls'];
}

function paginationCreated() {
    tableStore.addPagination();
}

function leftToolbarCreated() {
    tableCardDefaultSlots.value.header = null;
    tableStore.addLeftToolbar();
}

function leftToolbarDestroy() {
    if (!hasProxy('rightToolbar')) delete tableCardDefaultSlots.value.header;
}

function rightToolbarCreated() {
    tableCardDefaultSlots.value.header = null;
    tableStore.addRightToolbar();
}
function rightToolbarDestroy() {
    if (!hasProxy('leftToolbar')) delete tableCardDefaultSlots.value.header;
}

function updateDrawerCreated() {
    tableStore.addUpdateDrawer()
}

function updateDrawerFooterCreated() {
    updateDrawerDefaultSlots.value.footer = null;
    tableStore.addUpdateDrawerFooter()
}

function updateDrawerFooterDestroy() {
    delete updateDrawerDefaultSlots.value.footer;
}

function updateFormCreated() {
    tableStore.addUpdateForm(updateFormRef)
}
// #endregion

// #region 修改Bind挂载function的入参
function updateFunArguments(options, params) {
    let res = Object.assign({}, options);
    Object.keys(options).forEach(key => {
        const value = options[key];

        // value是否是function
        if (validType(value, 'Function')) {
            res[key] = (...arg) => value(params, ...arg)
        }
    })
    return res
}
// #endregion

defineExpose(tableStore)
</script>


<style lang="scss" scoped>
.ui-card {
    border-radius: v-bind(cardRadius);
}

.ui-table {
    flex: 1;
}

.pagination-container {
    padding: 20px 0 0;
}
</style>

<style lang="scss">
.ui-crud {
    display: flex;
    gap: v-bind(gutter);
    width: 100%;
    height: 100%;
    padding: v-bind(gutter);
    box-sizing: border-box;
}

.ui-crud-sidebar-card {
    flex-shrink: 0;
    width: v-bind(sidebarWidth);
}

.ui-crud-main {
    width: calc(100% - v-bind(gutter) - v-bind(sidebarWidth));
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: v-bind(gutter);
}

.ui-crud-table-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.ui-right-toolbar-wrap {
    display: flex;
    align-items: center;
}
</style>