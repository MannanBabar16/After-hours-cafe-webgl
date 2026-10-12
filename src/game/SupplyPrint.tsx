import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { supplyCatalog } from "../data/operations";
import type { SupplyBox } from "../store/operationTypes";
export function SupplyPrint({ box }: { box: SupplyBox }) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const x = c.getContext("2d")!;
    const p = supplyCatalog[box.supply];
    x.fillStyle = "#f4e8d6";
    x.fillRect(0, 0, 512, 256);
    x.fillStyle = p.color;
    x.fillRect(0, 0, 512, 17);
    x.strokeStyle = "#624936";
    x.lineWidth = 7;
    x.lineCap = "round";
    x.lineJoin = "round";
    x.fillStyle = "#624936";
    if (box.supply === "beans") {
      x.save();
      x.translate(88, 102);
      x.rotate(-0.45);
      x.beginPath();
      x.ellipse(0, 0, 29, 42, 0, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = "#dcc49e";
      x.lineWidth = 4;
      x.beginPath();
      x.moveTo(0, -30);
      x.bezierCurveTo(-12, -8, 12, 10, 0, 30);
      x.stroke();
      x.restore();
    } else if (box.supply === "milk") {
      x.beginPath();
      x.moveTo(66, 70);
      x.lineTo(104, 70);
      x.lineTo(116, 140);
      x.lineTo(54, 140);
      x.closePath();
      x.stroke();
      x.strokeRect(69, 52, 32, 17);
      x.fillStyle = "#bdd0c1";
      x.fillRect(63, 108, 45, 22);
    } else if (box.supply === "cups") {
      x.beginPath();
      x.moveTo(51, 72);
      x.lineTo(123, 72);
      x.lineTo(110, 142);
      x.lineTo(64, 142);
      x.closePath();
      x.stroke();
      x.beginPath();
      x.ellipse(87, 71, 37, 11, 0, 0, Math.PI * 2);
      x.stroke();
      x.fillStyle = "#87997a";
      x.fillRect(61, 97, 52, 23);
    } else if (box.supply === "dough") {
      x.fillStyle = "#c89c65";
      x.beginPath();
      x.arc(87, 98, 43, 0, Math.PI * 2);
      x.fill();
      x.stroke();
      x.fillStyle = "#624936";
      [
        [67, 75],
        [107, 88],
        [81, 116],
        [63, 103],
        [103, 120],
      ].forEach(([a, b]) => {
        x.beginPath();
        x.arc(a, b, 5, 0, Math.PI * 2);
        x.fill();
      });
    } else {
      x.beginPath();
      x.moveTo(71, 64);
      x.lineTo(103, 64);
      x.lineTo(103, 80);
      x.lineTo(119, 90);
      x.lineTo(119, 148);
      x.lineTo(56, 148);
      x.lineTo(56, 90);
      x.lineTo(71, 80);
      x.closePath();
      x.stroke();
      x.fillStyle = "#b8a16c";
      x.fillRect(63, 111, 50, 22);
    }
    x.textAlign = "left";
    x.fillStyle = "#624936";
    x.font = "bold 35px Segoe UI";
    const title = {
      beans: "COFFEE BEANS",
      milk: "FRESH MILK",
      cups: "PAPER CUPS",
      dough: "COOKIE DOUGH",
      syrup: "VANILLA",
    }[box.supply];
    x.fillText(title, 156, 84, 335);
    x.font = "27px Segoe UI";
    x.fillStyle = "#7c8767";
    x.fillText(`${box.quantity} ${p.unit}`, 157, 126, 320);
    x.font = "19px Segoe UI";
    x.fillStyle = "#a28c70";
    x.fillText("MOON DELIVERY  /  AFTER HOURS", 52, 211);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [box.supply, box.quantity]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 0.3, 0.262]}>
      <planeGeometry args={[0.52, 0.27]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
