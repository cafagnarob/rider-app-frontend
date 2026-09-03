import { useGetRideByIdQuery } from "../../src/features/rides/ridesApi"
import { useGetRouteByIdQuery } from "../../src/features/routesMap/routesApi"
import { useGetEventByIdQuery } from "../../src/features/events/eventsApi"
import { useGetModelByIdQuery } from "../../src/features/catalog/catalogApi"
import PostWidgetPreview from "../../src/features/social/components/PostWidgetPreview"

function PostWidgetLoader({ type, referenceId, size }) {
  const { data: rideData } = useGetRideByIdQuery(referenceId, {
    skip: type !== "RIDE",
  })
  const { data: routeData } = useGetRouteByIdQuery(referenceId, {
    skip: type !== "ROUTE",
  })
  const { data: eventData } = useGetEventByIdQuery(referenceId, {
    skip: type !== "EVENT",
  })
  const { data: modelData } = useGetModelByIdQuery(referenceId, {
    skip: type !== "VEHICLE",
  })

  let data = null
  if (type === "RIDE") data = rideData
  if (type === "ROUTE") data = routeData
  if (type === "EVENT") data = eventData
  if (type === "VEHICLE" && modelData)
    data = { nickname: null, model: modelData }

  if (!data) return null

  return <PostWidgetPreview type={type} size={size} data={data} />
}

export default PostWidgetLoader
