<template>
  <o-field :label-for="id" class="taginput-field">
    <template #label>
      <p class="inline-flex items-center gap-0.5">
        {{ t("Add some tags") }}
        <o-tooltip
          variant="dark"
          :label="
            t('You can add tags by hitting the Enter key or by adding a comma')
          "
        >
          <HelpCircleOutline :size="16" />
        </o-tooltip>
      </p>
    </template>
    <o-taginput
      :modelValue="tagsStrings"
      @update:modelValue="updateTags"
      :options="filteredTags"
      :autocomplete="true"
      :allow-new="true"
      icon="label"
      :maxlength="20"
      :maxitems="10"
      :placeholder="t('Eg: Stockholm, Dance, Chess…')"
      @input="getFilteredTags"
      :id="id"
      dir="auto"
      expanded
    >
    </o-taginput>
  </o-field>
</template>
<script lang="ts" setup>
import differenceBy from "lodash/differenceBy";
import { ITag } from "@/types/tag.model";
import { computed, onBeforeMount, ref, watch } from "vue";
import HelpCircleOutline from "vue-material-design-icons/HelpCircleOutline.vue";
import { useFetchTags } from "@/composition/apollo/tags";
import { FILTER_TAGS } from "@/graphql/tags";
import { useI18n } from "vue-i18n";
import { OptionsPropItem } from "@oruga-ui/oruga-next";

const props = defineProps<{
  modelValue: ITag[];
}>();

const propsValue = computed(() => props.modelValue);

const tagsStrings = ref<string[]>([]);

const emit = defineEmits(["update:modelValue"]);

const text = ref("");

const tags = ref<ITag[]>([]);

const { t } = useI18n({ useScope: "global" });

let componentId = 0;

onBeforeMount(() => {
  componentId += 1;
});

const id = computed((): string => {
  return `tag-input-${componentId}`;
});

const {
  load: fetchTags,
  refetch: refetchTags,
  onResult: onTagsResult,
} = useFetchTags();

initTagsStringsValue();

onTagsResult(({ data }) => {
  if (!data) {
    console.error("onTagsResult: data is null");
    return;
  }
  if (!data.tags) {
    console.error("onTagsResult: data.tags is null. data: ", data);
    return;
  }
  tags.value = data.tags;
});

const getFilteredTags = async (newText: string): Promise<void> => {
  text.value = newText;
  const res = await fetchTags(
    FILTER_TAGS,
    { filter: newText },
    { debounce: 200 }
  );
  // fetchTags return false, except the first time
  // We need to refetch after
  // https://v4.apollo.vuejs.org/api/use-lazy-query.html
  if (!res) refetchTags({ filter: newText });
};

const filteredTags = computed<OptionsPropItem<ITag>[]>(() => {
  // Empty list if there is no written text
  if (text.value == "") return [];

  return differenceBy(tags.value, propsValue.value, "slug")
    .filter(
      (tag) =>
        tag.title.toLowerCase().includes(text.value.toLowerCase()) ||
        tag.slug.toLowerCase().includes(text.value.toLowerCase())
    )
    .map((tag) => ({
      label: tag.title,
      value: { title: tag.title, slug: tag.slug },
    }));
});

const updateTags = (newTagsStrings: (string | ITag)[]) => {
  const seen = new Set<string>();

  const tagEntities = newTagsStrings.reduce<ITag[]>((acc, tag) => {
    const title = typeof tag === "string" ? tag : tag.title;
    const lowerTitle = title.toLowerCase();

    // Don't allow the same tag with another case
    if (!seen.has(lowerTitle)) {
      seen.add(lowerTitle);
      acc.push(typeof tag === "string" ? { title: tag, slug: tag } : tag);
    }

    return acc;
  }, []);

  emit("update:modelValue", tagEntities);
};
function isArraysEquals(array1: string[], array2: string[]) {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }

  return true;
}

function initTagsStringsValue() {
  // This is useful when tag data is already cached from the API during navigation inside the app
  tagsStrings.value = propsValue.value.map((tag: ITag) => tag.title);

  // This watch() function is useful when tag data loads directly from the API upon page load
  watch(propsValue, () => {
    const newTagsStrings = propsValue.value.map((tag: ITag) => tag.title);

    // Changing tagsStrings.value triggers updateTags(), updateTags() triggers this watch() function again.
    // To stop the loop, edit tagsStrings.value only if it has changed !
    if (!isArraysEquals(tagsStrings.value, newTagsStrings)) {
      tagsStrings.value = newTagsStrings;
    }
  });
}
</script>
