import api from "./api";

const publicService = {
  getHomeData: async () => {
    const response = await api.get("/public/home-data");
    return response.data;
  },
  // API Lấy danh sách kèm Filter
  getVarietiesList: async (params) => {
    const response = await api.get("/public/varieties", { params });
    return response.data;
  },
  // API Lấy dữ liệu So sánh
  getCompareData: async (ids) => {
    const response = await api.post("/public/varieties/compare", { ids });
    return response.data;
  },
  getUIEnumMapping: async () => {
    const response = await api.get("/taxonomy/varieties/ui-options");
    return response.data;
  },
  fetchAllItems: async (type) => {
    const res = await api.get(`/taxonomy/${type}/all`);
    return res.data;
  },
  fetchProvinces: async () => {
    const res = await api.get(`/taxonomy/varieties/provinces`);
    return res.data;
  },
  getTaxonomyTree: async (params) => {
    const res = await api.get(`/public/taxonomy-tree`, { params });
    return res.data;
  },
  getVarietyDetail: async (id) => {
    const response = await api.get(`/public/varieties/${id}`);
    return response.data;
  },
  incrementView: async (id) => {
    const response = await api.post(`/public/varieties/${id}/view`);
    return response.data;
  },
  aiSearchImage: async (imageBase64, bbox, parts) => {
    const response = await api.post("/ai/search", { imageBase64, bbox, parts });
    return response.data;
  },
  getTaxonomyPageSmartSelectOptions: async ({ model_get, lang_priority }) => {
    const response = await api.get("/public/taxonomy/smart-select-options", {
      params: {
        model_get: model_get,
        lang_priority: lang_priority.join(","),
      },
    });
    return response.data;
  },
  getTaxonomyList: async (params) => {
    const response = await api.get("/public/taxonomy", { params });
    return response.data;
  },
  getCompareDataTaxonomy: async (ids, rank) => {
    const response = await api.post("/public/taxonomy/compare", {
      ids: ids.join(","),
      rank: rank,
    });
    return response.data;
  },
  getTaxonomyDetail: async (id, rank, shouldIncrement) => {
    // Gọi phương thức GET truyền kèm Query Parameter động theo chuẩn cấu trúc phân tầng
    const response = await api.get(`/public/taxonomy/detail/${id}`, {
      params: { rank: rank, increment: shouldIncrement },
    });
    return response.data;
  },
  getTaxonomyTreeSmartSelectOptions: async () => {
    const response = await api.get(
      "/public/taxonomy-tree/smart-select-options",
    );
    return response.data;
  },
};

export default publicService;
