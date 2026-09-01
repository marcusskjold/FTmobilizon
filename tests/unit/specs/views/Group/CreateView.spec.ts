import { beforeEach, describe, it, expect, afterEach, vi } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import CreateView from "@/views/Group/CreateView.vue";
import { CREATE_GROUP } from "@/graphql/group";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

afterEach(async () => {
  await vi.dynamicImportSettled();
});

const generateWrapper = () => {
  const global_data = getMockClient([CREATE_GROUP]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(CreateView, {
    props: {},
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("CreateView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();

    expect(wrapper.find("form").exists()).toBe(true);
    wrapper.find('input[id="group-display-name"]').setValue("New Group");
    wrapper.find('input[id="group-preferred-username"]').setValue("new_group");
    wrapper.find('input[id="full-address-autocomplete-1"]').setValue("");
    wrapper.find('input[name="groupVisibility"]:nth-of-type(1)').setChecked();
    wrapper.findAll('input[name="groupOpenness"]')[1].setChecked();
    wrapper.find("form").trigger("submit");
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_0).toHaveBeenCalledWith({
      allowSeeParticipants: true,
      manuallyApprovesFollowers: false,
      name: "New Group",
      openness: "MODERATED",
      preferredUsername: "new_group",
      summary: "",
      visibility: "PUBLIC",
    });
  });
});
