import React, { useRef, useEffect, useState } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { TextureLoader, Sprite, SpriteMaterial, VideoTexture, Vector3 } from "three";

export default function ModeloPractica() {
  const gltf = useLoader(GLTFLoader, "/assets/model.glb");
  const texture = useLoader(TextureLoader, "/assets/baked.jpg");
  const screenTexture = useLoader(TextureLoader, "/assets/publicidad.jpg");
  const audioRef = useRef(new Audio("/assets/ambiente.mp3"));
  const penguinAudioRef = useRef(new Audio("/assets/penguin.mp3"));

  const noteTextures = [
    useLoader(TextureLoader, "/assets/note1.png"),
    useLoader(TextureLoader, "/assets/note2.png"),
    useLoader(TextureLoader, "/assets/note3.png"),
  ];

  const modelRef = useRef();
  const screenRef1 = useRef();
  const chairRef = useRef();
  const plantRef = useRef();
  const speakerRef = useRef();
  const notesRef = useRef([]);
  const screenRef = useRef();
  const noteIntervalRef = useRef(null);

  const [targetChairPosition, setTargetChairPosition] = useState(null);
  const [chairInitialPos, setChairInitialPos] = useState(null);
  const chairAudioRef = useRef(new Audio("/assets/chair-move.mp3"));
  const videoRef = useRef(document.createElement("video"));
  const [videoPlaying, setVideoPlaying] = useState(false); // Control del estado del video

  useEffect(() => {
    if (!gltf) return;

    texture.flipY = false;
    audioRef.current.loop = true;

    videoRef.current.src = "/assets/video.mp4";
    videoRef.current.crossOrigin = "anonymous";
    videoRef.current.loop = true;
    videoRef.current.muted = true;
    videoRef.current.play(); // Autoplay
    const videoTexture = new VideoTexture(videoRef.current);

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.name === "desktop-plane-0") {
          child.material = child.material.clone();
          child.material.map = videoTexture;
        } else if (child.name === "desktop-plane-1") {
          child.material = child.material.clone();
          child.material.map = screenTexture;
        } else {
          child.material.map = texture;
        }
        child.material.needsUpdate = true;
        console.log("🔹 Objeto encontrado:", child.name);
      }
    });

    chairRef.current = gltf.scene.getObjectByName("chair");
    plantRef.current = gltf.scene.getObjectByName("plant");
    speakerRef.current = gltf.scene.getObjectByName("speaker");

    if (screenRef.current) {
      screenRef.current.material = screenRef.current.material.clone();
      screenRef.current.material.map = screenTexture;
      screenRef.current.material.needsUpdate = true;
    }

    if (chairRef.current) {
      setChairInitialPos(chairRef.current.position.clone());
    }

    audioRef.current.loop = true;
  }, [gltf, texture, screenTexture]);

  useFrame(() => {
    if (chairRef.current && targetChairPosition) {
      chairRef.current.position.lerp(targetChairPosition, 0.1);
      if (chairRef.current.position.distanceTo(targetChairPosition) < 0.01) {
        setTargetChairPosition(null);
      }
    }

    notesRef.current.forEach((note, index) => {
      note.position.y += 0.02;
      note.material.opacity -= 0.005;

      if (note.material.opacity <= 0) {
        gltf.scene.remove(note);
        notesRef.current.splice(index, 1);
      }
    });
  });

  const handleSpeakerClick = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      console.log("🎵 Música activada");
      startNotes();
    } else {
      audioRef.current.pause();
      console.log("🔇 Música pausada");
      stopNotes();
    }
  };

  const startNotes = () => {
    stopNotes();
    noteIntervalRef.current = setInterval(() => {
      if (!speakerRef.current) return;

      const texture = noteTextures[Math.floor(Math.random() * 3)];
      const material = new SpriteMaterial({ map: texture, transparent: true, opacity: 1 });
      const note = new Sprite(material);

      const speakerPos = speakerRef.current.position.clone();
      note.position.set(speakerPos.x, speakerPos.y + 0.2, speakerPos.z);
      note.scale.set(0.3, 0.3, 0.3);

      gltf.scene.add(note);
      notesRef.current.push(note);
    }, 500);
  };

  const stopNotes = () => {
    clearInterval(noteIntervalRef.current);
  };

  const handleChairClick = () => {
    if (chairRef.current) {
      setTargetChairPosition(new Vector3(
        chairRef.current.position.x + 1.5,
        chairRef.current.position.y,
        chairRef.current.position.z
      ));

      chairAudioRef.current.play().catch((error) => console.error("❌ Error al reproducir audio:", error));
    }
  };

  const handleScreenClick = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setVideoPlaying(true);
      console.log("▶️ Video reproduciéndose");
    } else {
      videoRef.current.pause();
      setVideoPlaying(false);
      console.log("⏸️ Video pausado");
    }
  };

  const handleObjectClick = (event) => {
    event.stopPropagation();
    const clickedObject = event.object.name;
    console.log(clickedObject);

    if (clickedObject === "chair") {
      handleChairClick();
      console.log("🌿 Click en silla");
    } else if (clickedObject === "speaker") {
      handleSpeakerClick();
      console.log("🌿 Click en Speaker");
    } else if (clickedObject === "plant") {
      console.log("🌿 Click en planta: restaurando silla");
      handlePlantClick();
    } else if (clickedObject === "desktop-plane-1") {
      console.log("🖥️ Click en monitor 1");
      if (!videoPlaying) {
        videoRef.current.play();
        setVideoPlaying(true);
      }
    } else if (clickedObject === "mouse") {
      console.log("🖥️ Click en mause");
      handleScreenClick();
    } else if (clickedObject === "shelving") {  
      handleSpeakerClick();
      console.log("📚 Click en shelving: controlando la música de fondo");
    } else if (clickedObject === "penguin") {  
      penguinAudioRef.current.play();  
      console.log("🐧 Click en penguin: Reproduciendo sonido");
    }
  };

  const handlePlantClick = () => {
    if (!chairRef.current || !chairInitialPos) return;

    console.log("🌿 Click en planta: restaurando silla");
    setTargetChairPosition(chairInitialPos.clone());
  };

  return (
    <primitive
      object={gltf.scene}
      scale={1}
      position={[0, -1, 0]}
      onPointerDown={handleObjectClick}
    />
  );
}
