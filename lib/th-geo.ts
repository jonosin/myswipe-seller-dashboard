export type ThSubdistrict = {
  nameTh: string;
  type: "khwaeng" | "tambon";
  postalCode: string;
};

export type ThDistrict = {
  nameTh: string;
  type: "khet" | "amphoe";
  subdistricts: ThSubdistrict[];
};

export type ThProvince = {
  code: string;
  nameTh: string;
  districts: ThDistrict[];
};

export const thProvinces: ThProvince[] = [
  {
    code: "10",
    nameTh: "กรุงเทพมหานคร",
    districts: [
      {
        nameTh: "วัฒนา",
        type: "khet",
        subdistricts: [
          { nameTh: "คลองตันเหนือ", type: "khwaeng", postalCode: "10110" },
        ],
      },
    ],
  },
  {
    code: "50",
    nameTh: "เชียงใหม่",
    districts: [
      {
        nameTh: "เมืองเชียงใหม่",
        type: "amphoe",
        subdistricts: [
          { nameTh: "ศรีภูมิ", type: "tambon", postalCode: "50200" },
        ],
      },
    ],
  },
  {
    code: "83",
    nameTh: "ภูเก็ต",
    districts: [
      {
        nameTh: "กะทู้",
        type: "amphoe",
        subdistricts: [
          { nameTh: "ป่าตอง", type: "tambon", postalCode: "83150" },
        ],
      },
    ],
  },
];

export function getDistricts(provinceNameTh: string): ThDistrict[] {
  return thProvinces.find((p) => p.nameTh === provinceNameTh)?.districts ?? [];
}

export function getSubdistricts(provinceNameTh: string, districtNameTh: string): ThSubdistrict[] {
  const p = thProvinces.find((pp) => pp.nameTh === provinceNameTh);
  const d = p?.districts.find((dd) => dd.nameTh === districtNameTh);
  return d?.subdistricts ?? [];
}

export function isBangkok(provinceNameTh?: string) {
  return provinceNameTh === "กรุงเทพมหานคร";
}
