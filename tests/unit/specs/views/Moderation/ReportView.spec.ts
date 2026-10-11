import { beforeEach, describe, it, expect } from "vitest";
import { enUS } from "date-fns/locale";
import { routes } from "@/router";
import { createRouter, createWebHistory, Router } from "vue-router";
import { config, mount } from "@vue/test-utils";
import { Oruga } from "@oruga-ui/oruga-next";
import flushPromises from "flush-promises";
import { getMockClient, requestHandlers } from "../../mocks/client";
import { htmlRemoveId } from "../../common";
import ReportView from "@/views/Moderation/ReportView.vue";
import { DELETE_ACCOUNT_AS_MODERATOR, GET_USER } from "@/graphql/user";
import { SUSPEND_PROFILE } from "@/graphql/actor";
import { DELETE_COMMENT } from "@/graphql/comment";
import { DELETE_EVENT } from "@/graphql/event";
import { CREATE_REPORT_NOTE, REPORT, UPDATE_REPORT } from "@/graphql/report";

config.global.plugins.push(Oruga);

let router: Router;

beforeEach(async () => {
  router = createRouter({
    history: createWebHistory(),
    routes: routes,
  });

  // await router.isReady();
});

const generateWrapper = () => {
  const report_mock = {
    data: {
      report: {
        __typename: "Report",
        id: 132456,
        insertedAt: null,
        updatedAt: null,
        comments: {
          total: 0,
          elements: [],
        },
      },
    },
  };
  const global_data = getMockClient([
    CREATE_REPORT_NOTE,
    [REPORT, report_mock],
    UPDATE_REPORT,
    DELETE_EVENT,
    DELETE_COMMENT,
    SUSPEND_PROFILE,
    GET_USER,
    DELETE_ACCOUNT_AS_MODERATOR,
  ]);
  global_data.provide.dateFnsLocale = enUS;
  global_data.plugins = [router];
  return mount(ReportView, {
    props: {
      reportId: "789456",
    },
    global: {
      ...global_data,
      stubs: {
        RouterLink: false,
      },
    },
  });
};

describe("ReportView", () => {
  it("Show simple", async () => {
    const wrapper = generateWrapper();
    await wrapper.vm.$nextTick();
    await flushPromises();
    expect(htmlRemoveId(wrapper.html())).toMatchSnapshot();
    expect(requestHandlers.handle_0).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledTimes(1);
    expect(requestHandlers.handle_2).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_3).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_4).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_5).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_6).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_7).toHaveBeenCalledTimes(0);
    expect(requestHandlers.handle_1).toHaveBeenCalledWith({
      id: "789456",
    });
  });
});
