// The camera looks along (sin(yaw), cos(yaw)); screen-right is forward × up.
export function firstPersonMovement(yaw: number, horizontal: number, backward: number) {
  return {
    dx: -Math.cos(yaw) * horizontal - Math.sin(yaw) * backward,
    dz: Math.sin(yaw) * horizontal - Math.cos(yaw) * backward,
  };
}
