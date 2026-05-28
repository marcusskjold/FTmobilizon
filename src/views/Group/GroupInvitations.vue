<template>
  <div v-if="groupLoading" class="relative min-h-24">
    <o-loading :fullPage="false" :active="true" />
  </div>
  <div v-else-if="groupError">
    <o-notification type="danger" variant="danger">{{
      groupError.message
    }}</o-notification>
  </div>
  <div v-else-if="group">
    <breadcrumbs-nav
      :links="[
        {
          name: RouteName.GROUP,
          params: { preferredUsername: usernameWithDomain(group) },
          text: displayName(group),
        },
        {
          name: RouteName.GROUP_SETTINGS,
          params: { preferredUsername: usernameWithDomain(group) },
          text: t('Settings'),
        },
        {
          name: RouteName.GROUP_INVITATIONS_SETTINGS,
          params: { preferredUsername: usernameWithDomain(group) },
          text: t('Group invitations'),
        },
      ]"
    />
    <section class="container mx-auto section">
      <h1>{{ t("Invitations to join the group") }}</h1>

      <h2>{{ t("Member invitation by username") }}</h2>
      <form @submit.prevent="inviteMember">
        <o-field
          :label="t('Invite a new member')"
          label-for="new-member-field"
          horizontal
        >
          <o-field grouped expanded size="large">
            <o-input
              id="new-member-field"
              expanded
              v-model="newMemberUsername"
              :placeholder="t(`Ex: someone{'@'}mobilizon.org`)"
            />
            <o-button variant="primary" type="submit">{{
              t("Invite member")
            }}</o-button>
          </o-field>
        </o-field>
      </form>

      <h2>{{ t("Group invitation links") }}</h2>
      <o-field>
        <o-button
          variant="primary"
          :loading="createGroupInvitationLoading"
          @click="
            createGroupInvitation({
              groupId: group.id,
              label: '',
            })
          "
          >{{ t("New invitation") }}</o-button
        >
      </o-field>
      <div v-if="groupInvitationsLoading" class="relative min-h-24">
        <o-loading :fullPage="false" :active="groupInvitationsLoading" />
      </div>
      <div v-else-if="groupInvitationsError">
        <o-notification type="danger" variant="danger">{{
          groupInvitationsError?.message
        }}</o-notification>
      </div>
      <div v-else-if="groupInvitationsResult">
        <o-modal
          :close-button-aria-label="t('Close')"
          v-model:active="isShareModalActive"
        >
          <ShareModal
            :title="t('Share this group invitation link')"
            :text="t('Join my group')"
            :url="selectedURL"
            :input-label="t('Invitation URL')"
          ></ShareModal>
        </o-modal>
        <div v-if="!groupInvitationsResult.listInvitations.length">
          <o-notification type="info" variant="info">{{
            t(
              'No invitation yet. Create a new invitation with the button "New invitation".'
            )
          }}</o-notification>
        </div>
        <div v-else-if="groupInvitationsResult.listInvitations.length == 1">
          <o-field class="flex gap-1 flex-wrap">
            <o-button
              v-if="groupInvitationsResult.listInvitations[0].token"
              icon-left="share"
              @click="
                triggerShare(
                  invitationUrl(groupInvitationsResult.listInvitations[0].token)
                )
              "
              variant="primary"
              >{{ t("Share link") }}</o-button
            >
            <o-button
              variant="danger"
              icon-left="delete"
              @click="
                actionDeleteGroupInvitation(
                  groupInvitationsResult.listInvitations[0].token
                )
              "
              :loading="deleteGroupInvitationLoading"
              >{{ t("Delete invitation") }}</o-button
            >
          </o-field>
          <o-notification type="info" variant="info">{{
            t(
              'You can create another invitation link with the button "New invitation".'
            )
          }}</o-notification>
        </div>
        <div v-else>
          <o-table :data="groupInvitationsResult.listInvitations">
            <o-table-column
              field="label"
              :label="t('Label')"
              sortable
              v-slot="props"
            >
              <o-input
                v-if="updateInvitationToken == props.row.token"
                :placeholder="t('Label')"
                v-model="updateInvitationLabel"
              />
              <span v-else-if="props.row.label">{{ props.row.label }}</span>
              <span v-else>{{ t("(No label defined)") }}</span>
            </o-table-column>
            <o-table-column
              field="token"
              :label="t('URL')"
              sortable
              v-slot="props"
            >
              <o-button
                v-if="props.row.token"
                icon-left="share"
                @click="triggerShare(invitationUrl(props.row.token))"
                variant="primary"
                >{{ t("Share link") }}</o-button
              >
            </o-table-column>
            <o-table-column
              field="token"
              :label="t('Actions')"
              sortable
              v-slot="props"
            >
              <div class="flex gap-1 flex-wrap m-1">
                <o-button
                  variant="primary"
                  icon-left="pencil"
                  v-if="updateInvitationToken != props.row.token"
                  @click="
                    actionEditGroupInvitation(props.row.token, props.row.label)
                  "
                  :loading="updateGroupInvitationLoading"
                  >{{ t("Edit label") }}</o-button
                >
                <o-button
                  variant="success"
                  icon-left="check"
                  v-if="updateInvitationToken == props.row.token"
                  @click="actionUpdateGroupInvitation()"
                  :loading="updateGroupInvitationLoading"
                  >{{ t("Update label") }}</o-button
                >
                <o-button
                  variant="warning"
                  icon-left="close"
                  v-if="updateInvitationToken == props.row.token"
                  @click="actionCancelEditGroupInvitation()"
                  :loading="updateGroupInvitationLoading"
                  >{{ t("Cancel update") }}</o-button
                >
                <o-button
                  variant="danger"
                  icon-left="delete"
                  v-if="updateInvitationToken != props.row.token"
                  @click="actionDeleteGroupInvitation(props.row.token)"
                  :loading="deleteGroupInvitationLoading"
                  >{{ t("Delete invitation") }}</o-button
                >
              </div>
            </o-table-column>
          </o-table>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import RouteName from "@/router/name";
import {
  GROUP_INVITATIONS_LIST,
  GROUP_INVITATIONS_DELETE,
  GROUP_INVITATIONS_CREATE,
  GROUP_INVITATIONS_UPDATE,
} from "@/graphql/invitations";
import { usernameWithDomain, displayName } from "@/types/actor";
import { useHead } from "@/utils/head";
import { useI18n } from "vue-i18n";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { computed, inject, ref, watch } from "vue";
import { useGroup } from "@/composition/apollo/group";
import { IInvitation } from "@/types/actor/invitation.model";
import { useCurrentActorClient } from "@/composition/apollo/actor";
import ShareModal from "@/components/Share/ShareModal.vue";
import { IMember } from "@/types/actor/member.model";
import { INVITE_MEMBER } from "@/graphql/member";
import { Dialog } from "@/plugins/dialog";

const { t } = useI18n({ useScope: "global" });

useHead({
  title: computed(() => t("Group invitations")),
});

const props = defineProps<{ preferredUsername: string }>();
const preferredUsername = computed(() => props.preferredUsername);

const {
  group,
  loading: groupLoading,
  error: groupError,
} = useGroup(preferredUsername);

function invitationUrl(token: string) {
  return (
    window.location.origin +
    router.resolve({
      name: RouteName.GROUP_INVITATION_ACCEPT,
      params: {
        preferredUsername: group.value?.preferredUsername,
        token,
      },
    }).href
  );
}

// -------------------------------------------------------------
// Member invitation
// -------------------------------------------------------------

const newMemberUsername = ref("");

const {
  mutate: inviteMemberMutation,
  onDone: onInviteMemberDone,
  onError: onInviteMemberError,
} = useMutation<{ inviteMember: IMember }>(INVITE_MEMBER, () => ({}));

onInviteMemberError((error) => {
  console.error("onInviteMemberError:", error);
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    alert(error.graphQLErrors[0].message);
  }
});

onInviteMemberDone(() => {
  alert(
    t("{username} was invited to {group}", {
      username: newMemberUsername.value,
      group: displayName(group.value),
    })
  );
});

const inviteMember = async (): Promise<void> => {
  inviteMemberMutation({
    groupId: group.value?.id,
    targetActorUsername: newMemberUsername.value.toLowerCase(),
  });
};

// -------------------------------------------------------------
// List invitation links
// -------------------------------------------------------------

const {
  result: groupInvitationsResult,
  loading: groupInvitationsLoading,
  error: groupInvitationsError,
  refetch: groupInvitationsRefetch,
} = useQuery<{ listInvitations: IInvitation[] }>(
  GROUP_INVITATIONS_LIST,
  () => ({
    groupId: group.value?.id,
  }),
  {
    enabled: computed(() => !!group.value?.id),
  }
);

// We need to refetch when the actor is changed
const { currentActor } = useCurrentActorClient();

watch(currentActor, () => {
  groupInvitationsRefetch();
});

// -------------------------------------------------------------
// Create invitation links
// -------------------------------------------------------------

const {
  mutate: createGroupInvitation,
  onDone: onCreateGroupInvitationDone,
  onError: onCreateGroupInvitationError,
  loading: createGroupInvitationLoading,
} = useMutation(GROUP_INVITATIONS_CREATE);

onCreateGroupInvitationDone(() => {
  // TODO: No refetch, but update the cache
  groupInvitationsRefetch();
});

onCreateGroupInvitationError((error) => {
  alert(error.message);
});

// -------------------------------------------------------------
// Update invitation links
// -------------------------------------------------------------

const updateInvitationToken = ref<string>("");
const updateInvitationLabel = ref<string>("");

const {
  mutate: updateGroupInvitation,
  onDone: onUpdateGroupInvitationDone,
  onError: onUpdateGroupInvitationError,
  loading: updateGroupInvitationLoading,
} = useMutation(GROUP_INVITATIONS_UPDATE);

onUpdateGroupInvitationDone(() => {
  // TODO: No refetch, but update the cache
  groupInvitationsRefetch();
  updateInvitationToken.value = "";
  updateInvitationLabel.value = "";
});

onUpdateGroupInvitationError((error) => {
  alert(error.message);
});

const actionEditGroupInvitation = (token: string, label: string) => {
  updateInvitationToken.value = token;
  updateInvitationLabel.value = label;
};

const actionCancelEditGroupInvitation = () => {
  updateInvitationToken.value = "";
};

const actionUpdateGroupInvitation = () => {
  updateGroupInvitation({
    groupId: group.value?.id,
    token: updateInvitationToken.value,
    label: updateInvitationLabel.value,
  });
};

// -------------------------------------------------------------
// Delete invitation links
// -------------------------------------------------------------

const {
  mutate: deleteGroupInvitation,
  onDone: deleteGroupInvitationDone,
  onError: deleteGroupInvitationError,
  loading: deleteGroupInvitationLoading,
} = useMutation(GROUP_INVITATIONS_DELETE);

deleteGroupInvitationDone(() => {
  // TODO: No refetch, but update the cache
  groupInvitationsRefetch();
});

deleteGroupInvitationError((error) => {
  alert(error.message);
});

const dialog = inject<Dialog>("dialog");

const actionDeleteGroupInvitation = async (token: string): Promise<void> => {
  dialog?.confirm({
    title: t("Delete invitation?"),
    message:
      t("Do you really want to delete this invitation link to this group?") +
      "<br/>" +
      invitationUrl(token),
    confirmText: t("Delete invitation"),
    cancelText: t("Cancel"),
    variant: "danger",
    onConfirm: async () => {
      deleteGroupInvitation({
        groupId: group.value?.id,
        token: token,
      });
    },
  });
};

// -------------------------------------------------------------
// Share invitation links
// -------------------------------------------------------------

const router = useRouter();

const isShareModalActive = ref(false);
const selectedURL = ref("");

const triggerShare = (url: string): void => {
  console.error("triggerShare", url);
  if (!navigator.share) {
    selectedURL.value = url;
    isShareModalActive.value = true;
    return;
  }

  navigator
    .share({
      title: t("Join my group"),
      url: url,
    })
    .then(() => console.debug("Successful share"))
    .catch((error) => console.debug("Error sharing", error));
};
</script>
