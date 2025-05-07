<template>
    <div class="ui-dyn-component">
        <slot v-for="item in options" :key="item.prop" :name="item.prop">
            <component :is="item.fieldType" v-bind="updateFunArguments(item.fieldOptions)" />
        </slot>
    </div>
</template>

<script setup>
import { validType } from "@/utils/common";

const props = defineProps({
    options: {
        type: Array,
        default: () => [],
    }
})

const attrs = useAttrs();

function updateFunArguments(options) {
    let res = Object.assign({}, options);
    Object.keys(options).forEach(key => {
        const value = options[key];

        // value是否是function
        if (validType(value, 'Function')) {
            res[key] = (...arg) => value({ ...attrs }, ...arg)
        }
    })
    return res
}
</script>

<style lang="scss" scoped>

</style>