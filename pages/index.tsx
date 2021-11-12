import * as React from "react";
import { getOrientation, Orientation } from "get-orientation/browser";
import type { NextPage } from "next";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop/types";
import useWindowSize from "react-use/lib/useWindowSize";
import Confetti from "react-confetti";

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

enum STATE {
  idle = "idle",
  processing = "processing",
  success = "success",
  error = "error",
}

const Home: NextPage = () => {
  const { width, height } = useWindowSize();
  const [state, setState] = React.useState(STATE.idle);
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0);
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null
  );

  const downloadCroppedImage = async () => {
    setState(STATE.processing);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc!,
        croppedAreaPixels!,
        rotation
      );
      const scaledCrop = await getScaledCrop(croppedImage);
      const saveImg = document.createElement("a"); // New link we use to save it with
      saveImg.href = scaledCrop; // Assign image src to our link target
      saveImg.download = "crop.png"; // set filename for download
      saveImg.click();
      setState(STATE.success);
    } catch (e) {
      console.error("error", e);
      setState(STATE.error);
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
    <div className="h-screen max-h-screen flex flex-col relative">
      {state === STATE.success && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={600}
          recycle={false}
        />
      )}
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
          <div className="flex-shrink-0 p-8 flex justify-around">
            <button
              onClick={() => setImageSrc(null)}
              disabled={state === STATE.processing}
              className="w-64 h-16 bg-red-600 hover:bg-red-500 text-white rounded-xl text-lg flex justify-center items-center"
            >
              Zurücksetzen
            </button>
            <button
              onClick={downloadCroppedImage}
              className="w-64 h-16 bg-green-600 hover:bg-green-500 text-white rounded-xl text-lg flex justify-center items-center"
              disabled={state === STATE.processing}
            >
              {state === STATE.processing ? (
                <span className="inline-block h-6 w-6">
                  <svg
                    className="animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : (
                <span>Zuschnitt herunterladen</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="h-screen flex flex-col justify-center items-center">
          <div className="text-xl font-semibold mb-4">
            Bitte wähle zunächst eine Bild-Datei aus.
          </div>
          <input type="file" onChange={onFileChange} accept="image/*" />
        </div>
      )}
    </div>
  );
};

export default Home;
