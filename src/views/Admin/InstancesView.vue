<template>
  <div>
    <breadcrumbs-nav
      :links="[
        { name: RouteName.ADMIN, text: t('Admin') },
        { text: t('Instances') },
      ]"
    />
    <section>
      <h1 class="title">{{ t("Instances") }}</h1>
      <form @submit="followInstance" class="my-4">
        <o-field
          :label="t('Follow a new instance')"
          horizontal
          label-for="newRelayAddress"
        >
          <o-field grouped group-multiline expanded size="large">
            <p class="control">
              <o-input
                id="newRelayAddress"
                v-model="newRelayAddress"
                :placeholder="t('Ex: mobilizon.fr')"
              />
            </p>
            <p class="control">
              <o-button variant="primary" type="submit">{{
                t("Add an instance")
              }}</o-button>
              <o-loading
                :is-full-page="true"
                v-model="followInstanceLoading"
                :can-cancel="false"
              />
            </p>
          </o-field>
        </o-field>
      </form>
      <div class="flex flex-wrap gap-2">
        <o-field :label="t('Follow status')">
          <o-radio
            v-model="followStatus"
            :native-value="InstanceFilterFollowStatus.ALL"
            >{{ t("All") }}</o-radio
          >
          <o-radio
            v-model="followStatus"
            :native-value="InstanceFilterFollowStatus.WE_FOLLOW_THEM"
            >{{ t("We follow them") }}</o-radio
          >
          <o-radio
            v-model="followStatus"
            :native-value="InstanceFilterFollowStatus.WE_FOLLOW_THEM_PENDING"
            >{{ t("We asked to follow them") }}</o-radio
          >
          <o-radio
            v-model="followStatus"
            :native-value="InstanceFilterFollowStatus.THEY_FOLLOW_US"
            >{{ t("They follow us") }}</o-radio
          >
          <o-radio
            v-model="followStatus"
            :native-value="InstanceFilterFollowStatus.THEY_FOLLOW_US_PENDING"
            >{{ t("They asked to follow us") }}</o-radio
          >
          <o-radio
            v-model="followStatus"
            :native-value="InstanceFilterFollowStatus.OTHERS"
            >{{ t("Others") }}</o-radio
          >
        </o-field>
        <o-field
          :label="t('Domain or instance name')"
          label-for="domain-filter"
          class="flex-auto"
        >
          <o-input
            id="domain-filter"
            :placeholder="t('mobilizon-instance.tld')"
            v-model="filterDomain"
          />
        </o-field>
      </div>
      <div
        v-if="filteredInstances && filteredInstances.length > 0"
        class="my-3"
      >
        <p>
          {{
            t("{count} instances found", { count: filteredInstances.length })
          }}
        </p>
        <router-link
          :to="{
            name: RouteName.INSTANCE,
            params: { domain: instance.domain },
          }"
          class="min-w-0 flex items-center mb-2 rounded bg-mbz-yellow-alt-300 hover:bg-mbz-yellow-alt-200 dark:bg-mbz-purple-600 dark:hover:bg-mbz-purple-700 p-4 flex-wrap md:flex-nowrap justify-center gap-x-2 gap-y-3"
          v-for="instance in paginatedInstances"
          :key="instance.domain"
        >
          <div class="flex-1 overflow-hidden flex items-center gap-1">
            <img
              class="w-12"
              v-if="instance.software === 'Mobilizon'"
              src="/img/logo.svg"
              alt=""
            />
            <mastodon-logo
              class="w-8 mx-2"
              alt=""
              v-else-if="instance.software?.toLowerCase() === 'mastodon'"
            />
            <img
              class="w-8 mx-2"
              v-else-if="instance.software?.toLowerCase() === 'gancio'"
              src="/img/gancio.png"
              alt=""
            />
            <img
              class="w-8 mx-2"
              v-else-if="instance.software?.toLowerCase() === 'wordpress'"
              src="/img/wordpress-logo.svg"
              alt=""
            />
            <CloudQuestion class="mx-1.5" v-else :size="36" />

            <div class="">
              <h3
                class="text-lg truncate font-bold line-clamp-1 text-slate-800 dark:text-slate-100"
                v-if="instance.instanceName"
              >
                {{ instance.instanceName }}
              </h3>
              <h3
                class="text-lg truncate font-bold text-slate-800 dark:text-slate-100"
                v-else
              >
                {{ instance.domain }}
              </h3>
              <div>
                <div class="flex flex-wrap gap-x-2 gap-y-1">
                  <p
                    v-if="instance.instanceName"
                    class="min-w-0 inline-flex gap-1 truncate text-slate-700 dark:text-slate-300"
                  >
                    <o-icon icon="web" />
                    <span>{{ instance.domain }}</span>
                  </p>
                  <p
                    v-if="instance.software"
                    class="capitalize text-slate-700 dark:text-slate-300 inline-flex gap-1"
                  >
                    <o-icon icon="server" />
                    {{ instance.software }}
                  </p>
                </div>
                <div>
                  <p
                    class="inline-flex gap-1 text-slate-700 dark:text-slate-300"
                    v-if="
                      instance.followedStatus === InstanceFollowStatus.APPROVED
                    "
                  >
                    <o-icon icon="inbox-arrow-down" />
                    {{ t("We follow them") }}
                  </p>
                  <p
                    class="inline-flex gap-1 text-slate-700 dark:text-slate-300"
                    v-else-if="
                      instance.followedStatus === InstanceFollowStatus.PENDING
                    "
                  >
                    <o-icon icon="inbox-arrow-down" />
                    {{ t("We asked to follow them") }}
                  </p>
                  <p
                    class="inline-flex gap-1 text-slate-700 dark:text-slate-300"
                    v-if="
                      instance.followerStatus == InstanceFollowStatus.APPROVED
                    "
                  >
                    <o-icon icon="inbox-arrow-up" />
                    {{ t("They follow us") }}
                  </p>
                  <p
                    class="inline-flex gap-1 text-slate-700 dark:text-slate-300"
                    v-else-if="
                      instance.followerStatus == InstanceFollowStatus.PENDING
                    "
                  >
                    <o-icon icon="inbox-arrow-up" />
                    {{ t("They asked to follow us") }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-none flex gap-3 ltr:ml-3 rtl:mr-3">
            <p class="flex flex-col text-center">
              <span class="text-xl">{{ instance.eventCount }}</span
              ><span class="text-sm">{{ t("Events") }}</span>
            </p>
            <p class="flex flex-col text-center">
              <span class="text-xl">{{ instance.personCount }}</span
              ><span class="text-sm">{{ t("Profiles") }}</span>
            </p>
          </div>
        </router-link>
        <o-pagination
          v-show="filteredInstances.length > INSTANCES_PAGE_LIMIT"
          :total="filteredInstances.length"
          v-model:current="instancePage"
          :per-page="INSTANCES_PAGE_LIMIT"
          :aria-next-label="t('Next page')"
          :aria-previous-label="t('Previous page')"
          :aria-page-label="t('Page')"
          :aria-current-label="t('Current page')"
        >
        </o-pagination>
      </div>
      <div v-else-if="filteredInstances && filteredInstances.length == 0">
        <empty-content icon="lan-disconnect" :inline="true">
          {{ t("No instance found.") }}
          <template #desc>
            <span v-if="hasFilter">
              {{
                t(
                  "No instances match this filter. Try resetting filter fields?"
                )
              }}
            </span>
            <span v-else>
              {{ t("You haven't interacted with other instances yet.") }}
            </span>
          </template>
        </empty-content>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ADD_INSTANCE, INSTANCES } from "@/graphql/admin";
import { Paginate } from "@/types/paginate";
import RouteName from "@/router/name";
import { IInstance } from "@/types/instance.model";
import EmptyContent from "@/components/Utils/EmptyContent.vue";
import {
  InstanceFilterFollowStatus,
  InstanceFollowStatus,
} from "@/types/enums";
import { useI18n } from "vue-i18n";
import {
  enumTransformer,
  integerTransformer,
  useRouteQuery,
} from "vue-use-route-query";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed, inject, ref, watch, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useHead } from "@/utils/head";
import CloudQuestion from "../../../node_modules/vue-material-design-icons/CloudQuestion.vue";
import { Notifier } from "@/plugins/notifier";
import MastodonLogo from "@/components/Share/MastodonLogo.vue";

const INSTANCES_PAGE_LIMIT = 10;

const instancePage = useRouteQuery("page", 1, integerTransformer);
const filterDomain = useRouteQuery("filterDomain", "");
const followStatus = useRouteQuery(
  "followStatus",
  InstanceFilterFollowStatus.ALL,
  enumTransformer(InstanceFilterFollowStatus)
);

// Number of instances asked by default
const instancesTotalOnline = ref(100);

const { result: instancesResult } = useQuery<{
  instances: Paginate<IInstance>;
}>(
  INSTANCES,
  () => ({
    page: 1,
    limit: instancesTotalOnline.value,
  }),
  {
    fetchPolicy: "cache-and-network",
  }
);

// All instances are retreived when we have total available
watchEffect(() => {
  const total = instancesResult.value?.instances.total;
  if (total && total > instancesTotalOnline.value) {
    instancesTotalOnline.value = total;
  }
});

watch([filterDomain, followStatus], () => {
  instancePage.value = 1;
});

const instances = computed(() => instancesResult.value?.instances);

// We do filtering locally
// Because it is nstantaneous + permit to filter on more thing than with online filter
const filteredInstances = computed(() => {
  // Filter by domain or instance name
  const filtered = instances.value?.elements.filter((i) =>
    i.domain.toLowerCase().includes(filterDomain.value.toLowerCase())
  );

  if (!filtered) return [];

  // Filter by followStatus
  switch (followStatus.value) {
    case InstanceFilterFollowStatus.OTHERS:
      return filtered.filter(
        (i) =>
          i.followedStatus !== InstanceFollowStatus.APPROVED &&
          i.followedStatus !== InstanceFollowStatus.PENDING &&
          i.followerStatus !== InstanceFollowStatus.APPROVED &&
          i.followerStatus !== InstanceFollowStatus.PENDING
      );
    case InstanceFilterFollowStatus.WE_FOLLOW_THEM:
      return filtered.filter(
        (i) => i.followedStatus === InstanceFollowStatus.APPROVED
      );
    case InstanceFilterFollowStatus.WE_FOLLOW_THEM_PENDING:
      return filtered.filter(
        (i) => i.followedStatus === InstanceFollowStatus.PENDING
      );
    case InstanceFilterFollowStatus.THEY_FOLLOW_US:
      return filtered.filter(
        (i) => i.followerStatus === InstanceFollowStatus.APPROVED
      );
    case InstanceFilterFollowStatus.THEY_FOLLOW_US_PENDING:
      return filtered.filter(
        (i) => i.followerStatus === InstanceFollowStatus.PENDING
      );
    default:
      return filtered;
  }
});

// Pagination
const start = computed(() => (instancePage.value - 1) * INSTANCES_PAGE_LIMIT);
const end = computed(() => start.value + INSTANCES_PAGE_LIMIT);
const paginatedInstances = computed(() => {
  return filteredInstances.value.slice(start.value, end.value);
});

const { t } = useI18n({ useScope: "global" });
useHead({
  title: computed(() => t("Federation")),
});

const followInstanceLoading = ref(false);

const newRelayAddress = ref("");

const hasFilter = computed((): boolean => {
  return (
    followStatus.value !== InstanceFilterFollowStatus.ALL ||
    filterDomain.value !== ""
  );
});

const router = useRouter();

const { mutate, onDone, onError } = useMutation<{
  addInstance: IInstance;
}>(ADD_INSTANCE);

onDone(({ data }) => {
  newRelayAddress.value = "";
  followInstanceLoading.value = false;
  router.push({
    name: RouteName.INSTANCE,
    params: { domain: data?.addInstance.domain },
  });
});

const notifier = inject<Notifier>("notifier");

onError((error) => {
  if (error.message) {
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      notifier?.error(error.graphQLErrors[0].message);
    }
  }
  followInstanceLoading.value = false;
});

const followInstance = async (e: Event): Promise<void> => {
  e.preventDefault();
  followInstanceLoading.value = true;
  const domain = newRelayAddress.value.trim(); // trim to fix copy and paste domain name spaces and tabs
  mutate({
    domain,
  });
};
</script>
<style lang="scss" scoped>
.tab-item {
  form {
    margin-bottom: 1.5rem;
  }
}

a {
  text-decoration: none !important;
}
</style>
