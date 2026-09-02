export const HELMET_TYPES = [
  {
    key: "racing",
    label: "RACING",
    colors: [
      {
        id: "racing-silver",
        label: "Silver",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340483/PT-2_0000_Livello-16_njxa3x.png",
      },
      {
        id: "racing-black",
        label: "Black",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340482/PT-2_0004_Livello-10_ekpuxf.png",
      },
      {
        id: "racing-japanese-blue",
        label: "Japanese Blue",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340482/PT-2_0005_Livello-13_n60ryb.png",
      },
      {
        id: "racing-blue",
        label: "Blue",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340481/PT-2_0010_Livello-9_ctkvgy.png",
      },
      {
        id: "racing-yellow-purple",
        label: "Yellow-Purple",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340480/PT-2_0009_Livello-14-copia-2_kxx5yz.png",
      },
      {
        id: "racing-aggressive-red",
        label: "Aggressive Red",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340479/PT-2_0007_Livello-14-copia-4_kmu7dt.png",
      },
      {
        id: "racing-japanese-red",
        label: "Japanese Red",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340479/PT-2_0006_Livello-12_jjc6xf.png",
      },
      {
        id: "racing-orange-blue",
        label: "Orange-Blue",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340479/PT-2_0001_Livello-17_shk8vt.png",
      },
      {
        id: "racing-geometric-yellow-purple",
        label: "Geometric Yellow-Purple",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340476/PT-2_0008_Livello-14-copia-3_xfbnbv.png",
      },
      {
        id: "racing-yellow-pink",
        label: "Yellow-Pink",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340476/PT-2_0002_Livello-15_gl3axl.png",
      },
      {
        id: "racing-gold-green",
        label: "Gold-Green",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340476/PT-2_0003_Livello-14_r8kssy.png",
      },
      {
        id: "racing-red",
        label: "Red",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788340476/PT-2_0011_Livello-11_bdqfuc.png",
      },
    ],
  },
  {
    key: "cross",
    label: "CROSS",
    colors: [
      {
        id: "cross-aggressive-blue-orange",
        label: "Aggressive Blue-Orange",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299783/riders-app/users/profile/ufbq4qig0ojhyfzkyymi.png",
      },
      {
        id: "cross-aggressive-yellow-pink",
        label: "Aggressive Yellow-Pink",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299175/Senza-titolo-1_0001_Livello-7_d72slm.png",
      },
      {
        id: "cross-aggressive-red-white",
        label: "Aggressive Red-White",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299169/Senza-titolo-1_0007_Livello-2_m027er.png",
      },
      {
        id: "cross-aggressive-yellow-red",
        label: "Aggressive Yellow-Red",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299168/Senza-titolo-1_0004_Livello-5_avhx39.png",
      },
      {
        id: "cross-blue",
        label: "Blue",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299168/Senza-titolo-1_0002_Livello-6_bvr2ia.png",
      },
      {
        id: "cross-red",
        label: "Red",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299168/Senza-titolo-1_0003_Livello-8_xmtyzc.png",
      },
      {
        id: "cross-yellow",
        label: "Yellow",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299168/Senza-titolo-1_0005_Livello-4_w2qjf4.png",
      },
      {
        id: "cross-black",
        label: "Black",
        url: "https://res.cloudinary.com/ehgscudu/image/upload/v1788299167/Senza-titolo-1_0006_Livello-3_ilyoal.png",
      },
    ],
  },
]

export const PRESET_AVATARS = HELMET_TYPES.flatMap((t) => t.colors)
export const PRESET_AVATAR_URLS = PRESET_AVATARS.map((a) => a.url)

export function isPresetAvatar(url) {
  return PRESET_AVATAR_URLS.includes(url)
}
