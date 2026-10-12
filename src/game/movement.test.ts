import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { firstPersonMovement } from "./movement";

describe("first-person movement follows the rendered camera", () => {
  it.each([0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.73])("keeps WASD correct at yaw %s", (yaw) => {
    const camera = new PerspectiveCamera();
    camera.position.set(0, 1.62, 0);
    camera.lookAt(Math.sin(yaw), 1.62, Math.cos(yaw));
    camera.updateMatrixWorld();
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const forward = camera.getWorldDirection(new Vector3());
    for (const [h, b, expected] of [
      [1, 0, right], [-1, 0, right.clone().negate()],
      [0, -1, forward], [0, 1, forward.clone().negate()],
    ] as const) {
      const { dx, dz } = firstPersonMovement(yaw, h, b);
      expect(new Vector3(dx, 0, dz).dot(expected)).toBeCloseTo(1, 6);
    }
  });
});
