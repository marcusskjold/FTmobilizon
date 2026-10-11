import { beforeEach, describe, it, expect, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import EditView from "@/views/Event/EditView.vue";
import {
  CREATE_EVENT,
  EDIT_EVENT,
  EVENT_PERSON_PARTICIPATION,
  FETCH_EVENT,
} from "@/graphql/event";
import { LOGGED_USER_PARTICIPATIONS } from "@/graphql/participant";
import { MemberRole } from "@/types/enums";
import { computed } from "vue";
import { LOGGED_USER_DRAFTS } from "@/graphql/actor";
import { CONFIG } from "@/graphql/config";
import { eventParticipantMock } from "../../mocks/event";
import { configMock } from "../../mocks/config";
import { setup_test_tiptap } from "../../mocks/tiptap";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  vi.mock("@/composition/apollo/actor", () => {
    return {
      useCurrentActorClient: () => {
        const error = null;
        const loading = null;
        const currentActor = computed(() => {
          return {
            id: 123,
            name: "test",
            domain: null,
            preferredUsername: "test",
          };
        });
        return { currentActor, error, loading };
      },
      useCurrentUserIdentities: () => {
        const error = null;
        const loading = null;
        const identities = computed(() => {
          return [
            {
              __typename: "Person",
              avatar: null,
              domain: null,
              id: "2",
              name: "test",
              preferredUsername: "test",
              summary: null,
              type: "PERSON",
              url: "http://mobilizon.test/@test",
            },
          ];
        });
        return { identities, error, loading };
      },
      usePersonStatusGroup: () => {
        const error = null;
        const loading = null;
        const person = computed(() => {
          return {
            memberships: {
              total: 1,
              elements: [
                {
                  role: MemberRole.ADMINISTRATOR,
                },
              ],
            },
          };
        });
        return { person, error, loading };
      },
    };
  });

  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  setup_test_tiptap();
});

const generateWrapper = (
  eventId: string | null,
  isUpdate: boolean,
  isDuplicate: boolean
) => {
  const global_data = getMockClient([
    [FETCH_EVENT, eventParticipantMock],
    EDIT_EVENT,
    EVENT_PERSON_PARTICIPATION,
    CREATE_EVENT,
    LOGGED_USER_DRAFTS,
    LOGGED_USER_PARTICIPATIONS,
    [CONFIG, configMock],
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(EditView, {
    props: {
      eventId: eventId,
      isUpdate: isUpdate,
      isDuplicate: isDuplicate,
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("EditView", () => {
  it("Update old event", async () => {
    const wrapper = generateWrapper(
      "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
      true,
      false
    );
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_6).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      uuid: "67e9b659-84d9-4414-99f3-a1baaa88cf2d",
    });
    expect(requestHandlers.handle_6).toHaveBeenCalledWith({});
    const edit = wrapper.find("input.o-input__input");
    edit.setValue("new title");
    const btn = wrapper.find("button.o-button--primary.o-button--expanded");
    expect(btn.text()).toBe("Update my event");
    await btn.trigger("click");
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();

    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_6).toHaveBeenCalledTimes(1);
  });

  it("Create event - draft", async () => {
    const wrapper = generateWrapper(null, false, false);
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_6).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      uuid: null,
    });
    expect(requestHandlers.handle_6).toHaveBeenCalledWith({});

    const edit = wrapper.find("input.o-input__input");
    edit.setValue("new title");
    const btn = wrapper.find("button.o-button--primary.o-button--expanded");
    expect(btn.text()).toBe("Create my event");
    await btn.trigger("click");
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();

    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_6).toHaveBeenCalledTimes(1);
  });
});
