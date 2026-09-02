import { isPresetAvatar } from "../utils/helmetAvatars"

function Avatar({ src, alt = "", className = "", ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${isPresetAvatar(src) ? "avatar--preset" : ""}`.trim()}
      {...rest}
    />
  )
}

export default Avatar
