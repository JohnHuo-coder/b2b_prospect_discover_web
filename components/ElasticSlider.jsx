"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Volume1, Volume2 } from "lucide-react";

import "./ElasticSlider.css";

const MAX_OVERFLOW = 50;

export default function ElasticSlider({
  value,
  defaultValue = 50,
  startingValue = 0,
  maxValue = 100,
  className = "",
  isStepped = false,
  stepSize = 1,
  leftIcon = <Volume1 className="icon" aria-hidden />,
  rightIcon = <Volume2 className="icon" aria-hidden />,
  onChange,
}) {
  return (
    <div className={`slider-container ${className}`}>
      <Slider
        value={value}
        defaultValue={defaultValue}
        startingValue={startingValue}
        maxValue={maxValue}
        isStepped={isStepped}
        stepSize={stepSize}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onChange={onChange}
      />
    </div>
  );
}

function Slider({
  value: controlledValue,
  defaultValue,
  startingValue,
  maxValue,
  isStepped,
  stepSize,
  leftIcon,
  rightIcon,
  onChange,
}) {
  const isControlled =
    controlledValue !== undefined && controlledValue !== null;
  const [internalValue, setInternalValue] = useState(
    isControlled ? controlledValue : defaultValue
  );
  const [displayValue, setDisplayValue] = useState(
    isControlled ? controlledValue : defaultValue
  );
  const [region, setRegion] = useState("middle");
  const sliderRef = useRef(null);
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    const nextValue = isControlled ? controlledValue : defaultValue;
    setDisplayValue(nextValue);
    if (!isControlled) {
      setInternalValue(defaultValue);
    }
  }, [controlledValue, defaultValue, isControlled]);

  useMotionValueEvent(clientX, "change", (latest) => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let overflowValue;

      if (latest < left) {
        setRegion("left");
        overflowValue = left - latest;
      } else if (latest > right) {
        setRegion("right");
        overflowValue = latest - right;
      } else {
        setRegion("middle");
        overflowValue = 0;
      }

      overflow.jump(decay(overflowValue, MAX_OVERFLOW));
    }
  });

  const updateValue = (nextValue) => {
    const rounded = Math.round(nextValue);
    setDisplayValue(rounded);
    if (!isControlled) {
      setInternalValue(rounded);
    }
    onChange?.(rounded);
  };

  const handlePointerMove = (event) => {
    if (event.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      let newValue =
        startingValue +
        ((event.clientX - left) / width) * (maxValue - startingValue);

      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }

      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      updateValue(newValue);
      clientX.jump(event.clientX);
    }
  };

  const handlePointerDown = (event) => {
    handlePointerMove(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = () => {
    animate(overflow, 0, { type: "spring", bounce: 0.5 });
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;

    return ((displayValue - startingValue) / totalRange) * 100;
  };

  return (
    <>
      <motion.div
        onHoverStart={() => animate(scale, 1.2)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.2)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.2], [0.7, 1]),
        }}
        className="slider-wrapper"
      >
        <motion.div
          animate={{
            scale: region === "left" ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 },
          }}
          style={{
            x: useTransform(() =>
              region === "left" ? -overflow.get() / scale.get() : 0
            ),
          }}
        >
          {leftIcon}
        </motion.div>

        <div
          ref={sliderRef}
          className="slider-root"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onLostPointerCapture={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } =
                    sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? "right" : "left";
                }
                return "center";
              }),
              height: useTransform(scale, [1, 1.2], [6, 12]),
              marginTop: useTransform(scale, [1, 1.2], [0, -3]),
              marginBottom: useTransform(scale, [1, 1.2], [0, -3]),
            }}
            className="slider-track-wrapper"
          >
            <div className="slider-track">
              <div
                className="slider-range"
                style={{ width: `${getRangePercentage()}%` }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          animate={{
            scale: region === "right" ? [1, 1.4, 1] : 1,
            transition: { duration: 0.25 },
          }}
          style={{
            x: useTransform(() =>
              region === "right" ? overflow.get() / scale.get() : 0
            ),
          }}
        >
          {rightIcon}
        </motion.div>
      </motion.div>
      <p className="value-indicator">{Math.round(displayValue)}</p>
    </>
  );
}

function decay(value, max) {
  if (max === 0) {
    return 0;
  }

  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);

  return sigmoid * max;
}
