import * as React from "react";
import { getOrientation, Orientation } from "get-orientation/browser";
import type { NextPage } from "next";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop/types";

import {
  getCroppedImg,
  getRotatedImage,
  getScaledCrop,
} from "lib/canvas-utils";

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
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );
  const [croppedImage, setCroppedImage] = React.useState<string | null>(null);

  const showCroppedImage = async () => {
    // console.log(croppedAreaPixels);
    // return;
    try {
      const croppedImage = await getCroppedImg(
        imageSrc!,
        croppedAreaPixels!,
        rotation
      );
      console.log("donee", { croppedImage });
      //   setCroppedImage(croppedImage);
      const scaledCrop = await getScaledCrop(croppedImage);
      const saveImg = document.createElement("a"); // New link we use to save it with
      saveImg.href = scaledCrop; // Assign image src to our link target
      saveImg.download = "crop.png"; // set filename for download
      saveImg.click();
    } catch (e) {
      console.error("error", e);
    }
  };

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

  const onCropComplete = React.useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  return (
    <div className="h-screen max-h-screen flex flex-col">
      {imageSrc ? (
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              rotation={rotation}
              zoom={zoom}
              aspect={2 / 1}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="flex-shrink-0 p-8 flex justify-center">
            <button
              onClick={showCroppedImage}
              className="bg-green-600 hover:bg-green-500 text-white p-5 rounded-xl text-lg"
            >
              Zuschnitt herunterladen
            </button>
          </div>
        </div>
      ) : (
        <input
          type="file"
          onChange={onFileChange}
          accept="image/*"
          onClick={showCroppedImage}
        />
      )}
    </div>
  );
};

export default Home;
