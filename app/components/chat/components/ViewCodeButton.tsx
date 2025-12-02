"use client";

import { ResultPayload } from "@/app/types/chat";
import { Button } from "@/components/ui/button";
import DisplayIcon from "./DisplayIcon";
import { FaCode } from "react-icons/fa6";
import { IoBarChart } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface CodeDisplayProps {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  merged?: boolean;
  payload: ResultPayload[];
  handleViewChange: (
    view: "chat" | "code" | "result" | "chart",
    payload: ResultPayload[] | null
  ) => void;
  showChartButton?: boolean;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({
  payload,
  merged,
  handleViewChange,
  showChartButton = true,
}) => {
  const [isCodeHovered, setIsCodeHovered] = useState(false);
  const [isChartHovered, setIsChartHovered] = useState(false);

  if (!payload) return null;

  // Check if data is suitable for chart visualization (has numeric columns)
  const canShowChart = payload.some((p) => {
    if (!p.objects || !Array.isArray(p.objects) || p.objects.length < 2) return false;
    // Check if there's at least one numeric value in the first object
    const firstObj = p.objects[0];
    if (typeof firstObj !== 'object' || firstObj === null) return false;
    return Object.values(firstObj).some(val => typeof val === 'number');
  });

  return (
    <motion.div
      className={`flex flex-row items-center`}
      initial={{ y: 20, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: 0.1,
      }}
    >
      <div className="flex flex-row gap-2 items-center">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.2,
          }}
        >
          <DisplayIcon payload={payload} />
        </motion.div>
        
        {/* Code Button */}
        <motion.div
          onHoverStart={() => setIsCodeHovered(true)}
          onHoverEnd={() => setIsCodeHovered(false)}
          initial={{ width: "2rem", y: 15, opacity: 0 }}
          animate={{
            width: isCodeHovered ? "auto" : "2rem",
            y: 0,
            opacity: 1,
          }}
          transition={{
            width: { duration: 0.3, ease: "easeInOut" },
            y: { type: "spring", stiffness: 300, damping: 20, delay: 0.3 },
            opacity: { duration: 0.2, delay: 0.3 },
          }}
          className="overflow-hidden"
        >
          <Button
            variant={"default"}
            className="bg-highlight/10 hover:bg-highlight/20 h-8 rounded-md flex items-center gap-2 px-2 whitespace-nowrap"
            onClick={() => {
              handleViewChange("code", payload);
            }}
          >
            <FaCode size={12} className="text-highlight flex-shrink-0" />
            <AnimatePresence>
              {isCodeHovered && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="text-highlight text-xs"
                >
                  Query
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Chart Button - only show if data can be visualized */}
        {showChartButton && canShowChart && (
          <motion.div
            onHoverStart={() => setIsChartHovered(true)}
            onHoverEnd={() => setIsChartHovered(false)}
            initial={{ width: "2rem", y: 15, opacity: 0 }}
            animate={{
              width: isChartHovered ? "auto" : "2rem",
              y: 0,
              opacity: 1,
            }}
            transition={{
              width: { duration: 0.3, ease: "easeInOut" },
              y: { type: "spring", stiffness: 300, damping: 20, delay: 0.35 },
              opacity: { duration: 0.2, delay: 0.35 },
            }}
            className="overflow-hidden"
          >
            <Button
              variant={"default"}
              className="bg-accent/10 hover:bg-accent/20 h-8 rounded-md flex items-center gap-2 px-2 whitespace-nowrap"
              onClick={() => {
                handleViewChange("chart", payload);
              }}
            >
              <IoBarChart size={12} className="text-accent flex-shrink-0" />
              <AnimatePresence>
                {isChartHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="text-accent text-xs"
                  >
                    Chart
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        )}

        {!merged && (
          <motion.div
            className="text-primary text-sm flex items-center justify-center rounded-md"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.4,
            }}
          >
            {payload[0].metadata.collection_name}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CodeDisplay;
