import * as React from "react";
import { getOrientation, Orientation } from "get-orientation/browser";
import type { NextPage } from "next";

import { getCroppedImg, getRotatedImage } from "lib/canvas-utils";

function readFile(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), false);
    reader.readAsDataURL(file);
  });
}

const ORIENTATION_TO_ANGLE: { [key in Orientation]: number } = {
  1: 0,
  2: 0,
  3: 180,
  4: 0,
  5: 0,
  6: 90,
  7: 0,
  8: -90,
};

const Home: NextPage = () => {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState(null);
  const [croppedImage, setCroppedImage] = React.useState(null);

  const onFileChange = async (e: React.FormEvent<HTMLInputElement>) => {
    if (e.currentTarget.files && e.currentTarget.files.length > 0) {
      const file = e.currentTarget.files[0];
      let imageDataUrl = await readFile(file);
      if (typeof imageDataUrl === "string") {
        // apply rotation if needed
        const orientation = await getOrientation(file);
        const rotation = ORIENTATION_TO_ANGLE[orientation];
        if (rotation) {
          imageDataUrl = await getRotatedImage(imageDataUrl, rotation);
        }

        setImageSrc(imageDataUrl);
      }
    }
  };
  return (
    <div>
      {imageSrc ? (
        <div>ding</div>
      ) : (
        <input type="file" onChange={onFileChange} accept="image/*" />
      )}
    </div>
  );
};

export default Home;
