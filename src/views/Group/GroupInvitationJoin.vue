<template>
  <div class="container mx-auto px-1 mb-6">
    <div v-if="groupLoading || currentActorLoading" class="relative min-h-24">
      <o-loading :fullPage="false" :active="true" />
    </div>

    <div v-else-if="groupError || currentActorError">
      <o-notification type="danger" variant="danger"
        >{{ groupError?.message }}
        {{ currentActorError?.message }}</o-notification
      >
    </div>

    <div v-else-if="group && currentActor">
      <h1>{{ t("Join a group") }}</h1>

      <div v-if="!acceptGroupInvitationSucceeded">
        <p class="my-1">
          <i18n-t
            keypath="Do you want to join the group {groupName} with the profile {preferredUsername} ?"
          >
            <template #groupName>
              <span
                >"<b>{{ groupName }}</b
                >"</span
              >
            </template>
            <template #preferredUsername>
              <span
                >"<b>{{ currentActor.preferredUsername }}</b
                >"</span
              >
            </template>
          </i18n-t>
        </p>
        <p class="my-1">
          {{
            t(
              "You can create a new profile or change the actual profile with the profile menu."
            )
          }}
        </p>

        <o-button
          variant="primary"
          :loading="acceptGroupInvitationLoading"
          :disabled="acceptGroupInvitationSucceeded"
          @click="
            acceptGroupInvitation({
              groupId: group.id,
              token: token,
              actorId: currentActor.id,
            })
          "
          >{{ t("Join group") }}</o-button
        >
      </div>

      <div v-else>
        <o-notification type="success" variant="success"
          ><i18n-t
            keypath="You successfully joined the group {groupName} with your profile {preferredUsername}."
          >
            <template #groupName>
              <span
                >"<b>{{ groupName }}</b
                >"</span
              >
            </template>
            <template #preferredUsername>
              <span
                >"<b>{{ currentActor.preferredUsername }}</b
                >"</span
              >
            </template>
          </i18n-t></o-notification
        >

        <o-button
          tag="router-link"
          variant="primary"
          :to="{
            name: RouteName.GROUP,
            params: {
              preferredUsername: groupName,
            },
          }"
          >{{ t("Go to the group page") }}</o-button
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCurrentActorClient } from "@/composition/apollo/actor";
import { useGroup } from "@/composition/apollo/group";
import { GROUP_INVITATIONS_ACCEPT } from "@/graphql/invitations";
import { IMember } from "@/types/actor/member.model";
import { useMutation } from "@vue/apollo-composable";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import RouteName from "@/router/name";

const { t } = useI18n({ useScope: "global" });

const props = defineProps<{ preferredUsername: string; token: string }>();
const groupName = computed(() => props.preferredUsername);
const token = computed(() => props.token);

// -------------------------------------------------------------
// Group informations
// -------------------------------------------------------------

const { group, loading: groupLoading, error: groupError } = useGroup(groupName);

// -------------------------------------------------------------
// Actor informations
// -------------------------------------------------------------

const {
  currentActor,
  loading: currentActorLoading,
  error: currentActorError,
} = useCurrentActorClient();

// -------------------------------------------------------------
// Accept invitation
// -------------------------------------------------------------

const acceptGroupInvitationSucceeded = ref<boolean>(false);
const memberRole = ref<string>();

const {
  mutate: acceptGroupInvitation,
  onDone: onAcceptGroupInvitationDone,
  onError: onAcceptGroupInvitationError,
  loading: acceptGroupInvitationLoading,
} = useMutation<{ acceptInvitationToken: IMember }>(GROUP_INVITATIONS_ACCEPT);

onAcceptGroupInvitationDone(({ data }) => {
  acceptGroupInvitationSucceeded.value = true;
  memberRole.value = data?.acceptInvitationToken?.role;
});

onAcceptGroupInvitationError((error) => {
  alert(error.message);
});

watch(currentActor, () => {
  acceptGroupInvitationSucceeded.value = false;
});
</script>
