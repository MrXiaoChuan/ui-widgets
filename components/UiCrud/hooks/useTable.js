import { deepClone, validType, deepMerge } from '@/utils/common';
import { ElMessageBox, ElMessage } from "element-plus"

// #region 代码修改手册
/**
 * ---------------------------------------------
 * ### 修改由setProxyModel定义`${prop}Bind`内的属性前，你需要知道 ###
 * 不成立（忽略） 1、你不能直接为`${prop}Bind`定义新的属性，你需要通过setProxyModel定义`${prop}Bind`内的属性
 * 2、双向绑定，分内部和外部
 *   - 内部表示：在UiCrud组件内的其他组件使用了v-model的属性，它在内外定义都必须使用v-model
 *   - 外部表示，在UiSlotProxy组件定义的v-model，它在内部不一定需要使用v-model；在外部时，如果你需要它动态响应，你需要在UiSlotProxy组件内定义v-model
 * 3、双向绑定仅外部使用时
 *   例如：
 *      - 内部的样子：<UiTable :data="tableStore.tableBind.data" />
 *      - 外部的样子（不需要获取，可不加data属性，由内部定义）：<UiSlotProxy key="table" />
 *      - 外部的样子（需要获取动态响应）：<UiSlotProxy key="table" v-model:data="data" />
 *      - 配置：{ data: [] }
 * 4、双向绑定内部使用时
 *   例如：
 *      - 内部的样子：<UiDrawer v-model="tableStore.updateDrawerBind['modelValue']" @update:model-value="tableStore.updateDrawerBind['onUpdate:modelValue']" />
 *      - 外部的样子（不需要获取，可不加data属性，由内部定义）：<UiSlotProxy key="table" />
 *      - 外部的样子（需要获取动态响应）：<UiSlotProxy key="table" v-model:data="data" />
 *      - 配置：{ 'modelValue': false, 'onUpdate:modelValue': (res) => { this.updateDrawerBind['modelValue'] = val; } }
 * 5、双向绑定外部使用时的顾忌点（我不太理解）; 还是以table为例
 *   环境：data在外部的<UiSlotProxy v-model:data="data" />定义了v-model后
 *   修改data方式：内部修改本应该调用外部传入的‘onUpdate:data’去做修改，可我直接使用this.tableBind.data = [];赋值
 *   不理解：
 *      - 外部传入的data属性，本是一个单项数据流，需要通过外部传入的‘onUpdate:data’去做修改
 *      - 可我使用this.tableBind.data = [];任然可以赋值且不报错和警告
 *   
 *   结论：
 *      - 个人觉得，应该是我在setProxyModel方法内使用了Object.assign()方法解构了attrs，
 *        导致attrs的'属性'丢失了（ps：属性，可以理解为proxy代理配置的读、写）
 *        使用解构是因为：attrs是只读的，不可被修改
 *        所以，目前直接赋值没有问题，可以先这样使用着，比起‘this.tableBind['onUpdate:data'](res);’代码要简洁些, 也是方便统一方式赋值
 * ---------------------------------------------
*/

/**
 * ---------------------------------------------
 * 使用watch注意, this指向有问题，就算是箭头函数也是一样，需要在外部定一个const that = this;的方式使用
 * ---------------------------------------------
*/
// #endregion

function useTable({ keyConfig, props, emit, slotsProxy, defaultOptions }) {
    const expose = reactive({});

    // #region 初始化
    expose.props = props;
    expose.emit = emit;
    expose.keyConfig = keyConfig;
    expose.defaultOptions = defaultOptions;
    expose.slotsProxy = slotsProxy;
    
    expose.addSearch = addSearch.bind(expose);
    expose.addTable = addTable.bind(expose);
    expose.addTableControls = addTableControls.bind(expose);
    expose.addTableStatus = addTableStatus.bind(expose);
    expose.addLeftToolbar = addLeftToolbar.bind(expose);
    expose.addRightToolbar = addRightToolbar.bind(expose);
    expose.addPagination = addPagination.bind(expose);
    expose.addUpdateDrawer = addUpdateDrawer.bind(expose);
    expose.addUpdateDrawerFooter = addUpdateDrawerFooter.bind(expose);
    expose.addUpdateForm = addUpdateForm.bind(expose);
    // #endregion
    
    return expose;
}

// #region 列表逻辑
function addTable(tableRef) {
    this.tableRef = tableRef;
    this.loading = false;
    this.isExpandAll = false;
    
    this.updateList = updateList.bind(this);
    this.onSelectionChange = onSelectionChange.bind(this);
    this.onAdd = onAdd.bind(this);
    this.onEdit = onEdit.bind(this);
    this.onRemove = onRemove.bind(this);
    this.onRemoveByRow = onRemoveByRow.bind(this);
    this.onExpand = onExpand.bind(this);
    this.toggleExpandAll = toggleExpandAll.bind(this);
    
    // #region 代理数据
    setProxyModel.call(this, 'table', {
        data: [],
        onSelectionChange: this.onSelectionChange
    });
    // #endregion

    const openSelection = this.tableBind.options?.some((item) => item.type === 'selection');
    if (openSelection) {
        this.selectionValue = [];
        this.selectionIds = computed(() => this.selectionValue.map((item) => item[this.keyConfig.id]));
        this.selectionNames = computed(() => this.selectionValue.map((item) => item[this.keyConfig.rowName]));
        this.single = false;
        this.multiple = false;
    }
}

function addTableControls() {
    const tableControlsOptionsPreset = {
        edit: {
            prop: 'edit',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '修改',
                link: true,
                type: 'primary',
                // 第一个参数来源UiDynComponent组件的attrs，可通过UiDynComponent组件上绑定的数据传入
                onClick: ({ scope }) => this.onEdit?.(scope.row[this.keyConfig.id])
            },
        },
        remove: {
            prop: 'remove',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '删除',
                link: true,
                type: 'primary',
                onClick: ({ scope }) => this.onRemoveByRow?.(scope.row)
            }
        }
    }
    // #region 代理数据
    setProxyModel.call(this, 'tableControls', {
        options: [],
    }, {
        format: {
            options: (val) => {
                if (!val) return val;
                return val.map((item) => {
                    if (typeof item === 'string') {
                        if (item in tableControlsOptionsPreset) return tableControlsOptionsPreset[item];
                        else return { prop: item, fieldType: 'UiButton', fieldOptions: { label: item } };
                    }
                    if (typeof item ==='object' && item.prop in tableControlsOptionsPreset) {
                        const target = deepClone(tableControlsOptionsPreset[item.prop])
                        deepMerge(target, item);
                        return target;
                    }
                    return item;
                })
            }
        }
    });
    // #endregion
}

function updateList() {
    if (!this.slotsProxy.table) return;
    if (!this.props.apis.list) {
        nextTick(() => {
            ElMessage.error('列表接口不存在')
        })

        setTimeout(() => {
            const res = [
                { id: '1911600421645332482', name: '张三', age: 18, sex: '男', address: '北京', status: '0', phone: '13800138000' },
                { id: 2, name: '张三', age: 18, sex: '男', address: '北京', status: '0', phone: '13800138000' },
                { id: 3, name: '张三', age: 18, sex: '男', address: '北京', status: '0', phone: '13800138000' },
            ];
            this.tableBind.data = res;
            this.paginationBind.total = 3
        }, 1000);
        return;
    }

    this.loading = true;

    let params = {};
    if (this.slotsProxy.search) params = Object.assign(params, this.searchBind.model);
    if (this.slotsProxy.pagination) params = Object.assign(params, {
        [this.keyConfig.page]: this.paginationBind.page,
        [this.keyConfig.limit]: this.paginationBind.limit
    });

    return this.props.apis.list(params).then((res) => {
        const { dataPropertyPath, totalPropertyPath } = this.defaultOptions;

        if (this.slotsProxy.pagination) {
            if ('result' in res) {
                this.tableBind.data = getPropertyByPath(res, dataPropertyPath || 'result.records') || [];
                this.paginationBind.total = getPropertyByPath(res, totalPropertyPath || 'result.total');
            } else if ('data' in res) {
                this.tableBind.data = getPropertyByPath(res, dataPropertyPath || 'data.list') || [];
                this.paginationBind.total = getPropertyByPath(res, totalPropertyPath || 'data.total');
            } else {
                this.tableBind.data = getPropertyByPath(res, dataPropertyPath || 'rows') || [];
                this.paginationBind.total = getPropertyByPath(res, totalPropertyPath || 'total');
            }
        } else {
            if ('rowKey' in this.tableBind) {
                this.tableBind.data = getPropertyByPath(res, dataPropertyPath || 'rows') || [];
            } else {
                this.tableBind.data = getPropertyByPath(res, dataPropertyPath || 'data') || [];
            }
        }

        // 树形table，刷新列表展开全部
        if ('rowKey' in this.tableBind) {
            nextTick(() => {
                this.isExpandAll = true;
                this.toggleExpandAll(this.tableBind.data, this.isExpandAll);
            })
        }

        this.emit('update-list-success');
        return res;
    }).catch(() => {
        this.tableBind.data = [];
        if (this.slotsProxy.pagination) this.total = 0;
    }).finally(() => {
        this.loading = false;
    });
}

function onSelectionChange(value) {
    this.selectionValue = value;
    this.single = value.length == 1;
    this.multiple = !!value.length;
}

function onAdd() {
    if (this.slotsProxy.updateForm) this.isEdit = false;
    if (this.slotsProxy.updateDrawer) this.updateDrawerBind.modelValue = true;
}

async function onEdit(value) {
    if (!this.slotsProxy.updateDrawer || !this.slotsProxy.updateForm) return;

    this.isEdit = true;
    if (this.slotsProxy.updateDrawer) this.updateDrawerBind.modelValue = true;

    if (!value) return ElMessage.error(`${this.keyConfig.id}或详情数据不存在`);

    const modelKeys = this.getUpdateModelKeys();
    if (validType(value, 'Object')) {
        this.updateDrawerBind.loading = true;
        nextTick(() => {
            modelKeys.forEach((key) => {
                if (key in value) this.updateFormBind.model[key] = value[key];
            });
            this.updateDrawerBind.loading = false;
        })
    } else {
        if (!this.props.apis.details) return ElMessage.error('详情接口不存在');
        this.updateDrawerBind.loading = true;
        await this.props.apis.details(value).then((res) => {
            const details = getPropertyByPath(res, this.keyConfig.detailsPropertyPath || 'data');
            
            modelKeys.forEach((key) => {
                if (key in details) {
                    this.updateFormBind.model[key] = details[key];
                }
            });
        })
        this.updateDrawerBind.loading = false;
    }
}

async function onRemove(params, content) {
    await ElMessageBox.confirm(content, '系统提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(async () => {
            if (!this.props.apis.remove) return ElMessage.error('删除接口不存在');
            await this.props.apis.remove(params).then(() => {
                ElMessage.success('删除成功');
                this.updateList();
            }).catch(() => {})
        })
        .catch(() => {
            ElMessage.info('已取消删除');
        })
}

function onRemoveByRow(row) {
    if (!this.slotsProxy.table) return;

    return this.onRemove?.(row[this.keyConfig.id], this.keyConfig.rowName ? `是否确认删除名称为“${row[this.keyConfig.rowName]}”的数据项?` : `此操作将永久删除该文件, 是否继续?`)
}

function onExpand() {
    if (!this.slotsProxy.table) return;

    this.isExpandAll = !this.isExpandAll;

    this.toggleExpandAll(this.tableBind.data, this.isExpandAll);
}

function toggleExpandAll(children, status) {
    children.forEach((item) => {
        this.tableRef.toggleRowExpansion(item, status);
        if (item[this.keyConfig.children] && item[this.keyConfig.children].length > 0) this.toggleExpandAll(item[this.keyConfig.children], status);
    });
}
// #endregion

// #region 列表状态
function addTableStatus() {
    this.onStatusTrigger = onStatusTrigger.bind(this);

    setProxyModel.call(this, 'tableStatus', {
        activeValue: '0',
        inactiveValue: '1',
        activeText: '启用',
        inactiveText: '禁用',
        inlinePrompt: true,
        onClick: this.onStatusTrigger
    })
}

function onStatusTrigger(scope) {
    const row = scope.row;
    if (this.props.apis.status) {

    } else {
        if (!this.slotsProxy.updateForm) {
            row[this.keyConfig.status] = this.updateFormBind.model[this.keyConfig.status] == this.tableStatusBind.activeValue ? this.tableStatusBind.inactiveValue : this.tableStatusBind.activeValue;
            return ElMessage.error('依赖updateForm模块');
        }
        if (!this.props.apis.edit) {
            row[this.keyConfig.status] = this.updateFormBind.model[this.keyConfig.status] == this.tableStatusBind.activeValue ? this.tableStatusBind.inactiveValue : this.tableStatusBind.activeValue;
            return ElMessage.error('修改接口不存在');
        }

        const modelKeys = this.getUpdateModelKeys();
        modelKeys.forEach((key) => {
            if (key in row) this.updateFormBind.model[key] = row[key];
            else delete this.updateFormBind.model[key];
        });

        this.props.apis.edit(this.updateFormBind.model).then(() => {
            ElMessage.success('修改成功');
        }, () => {
            row[this.keyConfig.status] = this.updateFormBind.model[this.keyConfig.status] == this.tableStatusBind.activeValue ? this.tableStatusBind.inactiveValue : this.tableStatusBind.activeValue;
        }).finally(() => {
            this.clearUpdateForm();
        })
    }
}
// #endregion

// #region 搜索
function addSearch({ searchFormRef }) {
    this.searchFormRef = searchFormRef;

    this.showSearch = computed(() => this.rightToolbarBind ? this.rightToolbarBind['showSearch'] : true);

    this.onSearch = onSearch.bind(this);
    this.onResetSearch = onResetSearch.bind(this);

    setProxyModel.call(this, 'search', {
        model: {},
        search: true,
        onSubmit: this.onSearch
    });
}

function onSearch() {
    if (this.slotsProxy.table) this.updateList();
}

function onResetSearch() {
    this.searchFormRef.resetFields();
    if (this.slotsProxy.table) this.updateList();
}
// #endregion

// #region 分页器
// 添加分页
function addPagination() {
    this.onPagination = onPagination.bind(this);

    // #region 代理数据
    setProxyModel.call(this, 'pagination', {
        total: 0,
        page: this.defaultOptions.page,
        'onUpdate:page': (val) => {
            this.paginationBind.page = val;
        },
        limit: this.defaultOptions.limit,
        'onUpdate:limit': (val) => {
            this.paginationBind.limit = val;
        },
        onPagination: this.onPagination
    });
    // #endregion
}

function onPagination() {
    if (this.slotsProxy.table) this.updateList();
}
// #endregion

// #region leftToolbar
function addLeftToolbar() {
    const leftToolbarOptionsPreset = reactive({
        add: {
            prop: 'add',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '新增',
                type: 'primary',
                onClick: () => this.onAdd?.()
            },
        },
        edit: {
            prop: 'edit',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '修改',
                type: "default",
                disabled: computed(() => !this.single),
                onClick: () => this.onEdit?.(this.selectionIds[0])
            },
        },
        remove: {
            prop: 'remove',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '删除',
                type: "default",
                disabled: computed(() => !this.multiple),
                onClick: () => this.onRemove?.(this.selectionIds, this.keyConfig.rowName ? `是否确认删除名称为“${this.selectionNames}”的数据项？` : `此操作将永久删除该文件, 是否继续？`)
            },
        },
        expand: {
            prop: 'expand',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '展开/折叠',
                type: "default",
                onClick: () => this.onExpand?.()
            },
        }
    })

    // #region 代理数据
    setProxyModel.call(this, 'leftToolbar', {
        options: [],
    }, {
        format: {
            options: (val) => {
                if (!val) return val;
                return val.map((item) => {
                    if (typeof item === 'string') {
                        if (item in leftToolbarOptionsPreset) return leftToolbarOptionsPreset[item];
                        else return { prop: item, fieldType: 'UiButton', fieldOptions: { label: item } };
                    }
                    if (typeof item ==='object' && item.prop in leftToolbarOptionsPreset) {
                        const target = deepClone(leftToolbarOptionsPreset[item.prop])
                        deepMerge(target, item);
                        return target;
                    }
                    return item;
                })
            }
        }
    });
    // #endregion
}
// #endregion

// #region rightToolbar
function addRightToolbar() {
    // #region 代理数据
    setProxyModel.call(this, 'rightToolbar', {
        showSearch: true,
        'onUpdate:showSearch': (val) => {
            this.rightToolbarBind['showSearch'] = val;
        },
        columns: [],
        onQueryTable: this.onSearch
    });
    // #endregion

    const tableColumnOptions = computed(() => deepClone(this.slotsProxy['table']?.attrs.options || []))

    const that = this;
    watch(tableColumnOptions, () => {
        // 修改onEdit热更新会出现that.rightToolbarBind不存在的问题
        if (!that.rightToolbarBind) return;
        that.rightToolbarBind.columns = tableColumnOptions.value.map((item) => {
            if ('prop' in item) {
                return {
                    key: item.prop,
                    label: item.label,
                    visible: 'visible' in item ? item.visible : true
                };
            }
            return;
        }).filter((item) => item)
    }, { immediate: true })

    if (this.slotsProxy.table) {
        this.tableBind.options = computed(() => {
            const showColumns = this.rightToolbarBind.columns.filter((item) => item.visible).map((item) => item.key);
            return tableColumnOptions.value.filter((item) => (item.prop ? showColumns.includes(item.prop) : true));
        });
    }
}
// #endregion

// #region updateDrawer
function addUpdateDrawer() {
    this.onClosed = onClosed.bind(this);
    this.onCancel = onCancel.bind(this);
    this.onSave = onSave.bind(this);

    // #region 代理数据
    setProxyModel.call(this, 'updateDrawer', {
        modelValue: false,
        'onUpdate:modelValue': (val) => {
            this.updateDrawerBind.modelValue = val;
        },
        title: computed(() => this.isEdit ? '修改' : '新增'),
        size: 'small',
        loading: false,
        onClosed: this.onClosed
    });
    // #endregion
}

function addUpdateDrawerFooter() {
    const footerOptionsPreset = {
        cancel: {
            prop: 'cancel',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '取消',
                onClick: () => this.onCancel?.()
            },
        },
        submit: {
            prop: 'submit',
            fieldType: 'UiButton',
            fieldOptions: {
                label: '提交',
                type: 'primary',
                onClick: () => this.onSave?.()
            }
        }
    }

    // #region 代理数据
    setProxyModel.call(this, 'updateDrawerFooter', {
        options: [],
    }, {
        format: {
            options: (val) => {
                if (!val) return val;
                return val.map((item) => {
                    if (typeof item === 'string') {
                        if (item in footerOptionsPreset) return footerOptionsPreset[item];
                        else return { prop: item, fieldType: 'UiButton', fieldOptions: { label: item } };
                    }
                    if (typeof item ==='object' && item.prop in footerOptionsPreset) {
                        const target = deepClone(footerOptionsPreset[item.prop])
                        deepMerge(target, item);
                        return target;
                    }
                    return item;
                })
            }
        }
    });
    // #endregion
}

function addUpdateForm(updateFormRef) {
    this.updateFormRef = updateFormRef;
    this.isEdit = false;

    // #region 代理数据
    setProxyModel.call(this, 'updateForm', {
        labelWidth: '80px',
        model: {},
        rules: {},
        options: [],
    });
    // #endregion

    // 用于重置model
    this.cloneUpdateModel = JSON.parse(JSON.stringify(this.updateFormBind.model));

    this.getUpdateModelKeys = getUpdateModelKeys.bind(this);
    this.clearUpdateForm = clearUpdateForm.bind(this);
}

function getUpdateModelKeys() {
    if (!this.slotsProxy.updateForm) return [];

    return [...new Set(
        // 编辑id + 表单model定义的key + 表单options定义的prop
        [this.keyConfig.editId || this.keyConfig.id].concat(Object.keys(this.updateFormBind.model), this.updateFormBind.options.map((item) => item.prop))
    )];
}

function onClosed() {
    this.clearUpdateForm();
}

function clearUpdateForm() {
    if (!this.slotsProxy.updateForm) return;

    const modelKeys = this.getUpdateModelKeys();

    modelKeys.forEach((key) => {
        if (key in this.cloneUpdateModel) this.updateFormBind.model[key] = this.cloneUpdateModel[key];
        else delete this.updateFormBind.model[key];
    });
    // table修改状态时，抽屉未打开，表单还未渲染，这种情况updateFormRef不存在
    this.updateFormRef?.resetFields();
}

function onCancel() {
    if (this.slotsProxy.updateDrawer) this.updateDrawerBind['modelValue'] = false;
}

function onSave() {
    if (!this.slotsProxy.updateForm || !this.slotsProxy.table) return;

    return new Promise((resolve, reject) => {
        this.updateFormRef.validate((valid) => {
            if (valid) {
                if (this.isEdit) {
                    if (!this.props.apis.edit) {
                        reject();
                        return ElMessage.error('修改接口不存在');
                    }
                    this.props.apis.edit(this.updateFormBind.model).then(() => {
                        this.updateDrawerBind.modelValue = false;
                        ElMessage.success('修改成功');
                        this.updateList();
                        this.emit('edit-success');
                        resolve()
                    }, reject);
                } else {
                    if (!this.props.apis.add) {
                        reject();
                        return ElMessage.error('新增接口不存在');
                    }
                    this.props.apis.add(this.updateFormBind.model).then(() => {
                        this.updateDrawerBind.modelValue = false;
                        ElMessage.success('新增成功');
                        this.updateList();
                        this.emit('add-success');
                        resolve()
                    }, reject);
                }
            } else {
                reject()
            }
        });
    })
}
// #endregion

// #region 公共方法
// 通过路径获取属性值 ’a.b‘ => {a:{b:1}} => 1
function getPropertyByPath(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (let part of parts) {
        if (current === undefined || current === null) {
            break;
        }
        current = current[part];
    }
    return current;
}

/**
 * 代理需要双向绑定的属性
 * 例如：UiTable 组件的 data 属性，它是不需要双向绑定的，但是我们在useTable中需要为它赋值；
 *      所以它在UiCrud组件中，不在是单项绑定，而是双向绑定的；所以我们需要代理它，让它也变成双向绑定的。
 * @param {string} name 代理的属性名
 * @param {Object} props 双向绑定的属性列表，key为属性名(定义时,不要使用小驼峰,采用'-'拼接)，value为默认值
 */
function setProxyModel(name, props, options = {}) {
    const bindName = `${name}Bind`;
    this[bindName] = formatAttrs(this.slotsProxy[name].attrs);

    const { format } = options;

    Object.keys(props).forEach((prop) => {
        const defaultValue = props[prop];
        if (!(prop in this[bindName])) this[bindName][prop] = defaultValue;
        else this[bindName][prop] = computed({
            get: () => {
                const newProp =  prop in this.slotsProxy[name].attrs ? prop : prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                const res = format && format[prop] ? format[prop](this.slotsProxy[name].attrs[newProp]) : this.slotsProxy[name].attrs[newProp];
                if (validType(res, 'Function')) {
                    return (...arg) => {
                        defaultValue(...arg);
                        res(...arg);
                    }
                } else {
                    return res;
                }
            },
            set: (val) => {
                this.slotsProxy[name].emit(`update:${prop}`, val);
            }
        })
    })
}

// 格式化属性名，将'-'转换为小驼峰连接的属性名
// 例如：'name-id' => 'nameId'
function formatAttrs(attrs) {
    const newAttrs = reactive({});
    for (const key in attrs) {
        const newKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        newAttrs[newKey] = computed(() => attrs[key]);
    }
    return newAttrs;
}
// #endregion

export default useTable;