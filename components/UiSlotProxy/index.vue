<script setup>
import { exposeSlotsProxy } from '@/utils/exposeElement';

// #region 前置变量
const instance = getCurrentInstance();
const emit = instance.emit;
const key = instance.vnode.key;
const attrs = useAttrs();
const slots = useSlots();
const slotProxyCreate = inject('slotProxyCreate')
const slotProxyDestory = inject('slotProxyDestory')
const proxyRef = ref({});

/**
 * 不能使用onBeforeUnmount、onUnmounted生命周期，调用slotProxyDestory卸载函数
 * 因为：onBeforeUnmount会在created前调用，时机不对，导致无限重载
 * 复现：写一个打印日志，刷新页面后，把日志内容修改一下，热更新后就会无限重载）
 * onUnmounted会在created后调用，时机也不对，会把创建好的代理释放掉
 * 所以：改用创建前先执行卸载函数，再创建
*/

// 在onMounted时创建，是为了解决UiCrud内使用v-show时，值为计算属性，热更新UiSlotProxy无限重载UiCrud的template内容
// 卸载代理
slotProxyDestory?.(key)
// 创建代理
slotProxyCreate?.(key, {
    attrs,
    slots,
    emit,
    setProxyRef,
})

function setProxyRef(value) {
    proxyRef.value = value;
}
// #endregion

defineExpose(exposeSlotsProxy(key, proxyRef));
</script>