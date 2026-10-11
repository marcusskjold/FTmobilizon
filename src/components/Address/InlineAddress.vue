<template>
  <div
    class="flex gap-1"
    dir="auto"
    :title="
      isDescriptionDifferentFromLocality
        ? `${physicalAddress.description}, ${physicalAddress.locality}`
        : physicalAddress.description
    "
  >
    <MapMarker />
    <span class="truncate">
      {{ physicalAddress.locality || physicalAddress.description }}
    </span>
  </div>
</template>
<script lang="ts" setup>
import { IAddress } from "@/types/address.model";
import MapMarker from "vue-material-design-icons/MapMarker.vue";
import { computed } from "vue";

const props = defineProps<{
  physicalAddress: IAddress;
}>();

const isDescriptionDifferentFromLocality = computed<boolean>(() => {
  return (
    props.physicalAddress?.description !== props.physicalAddress?.locality &&
    props.physicalAddress?.description !== undefined
  );
});
</script>
