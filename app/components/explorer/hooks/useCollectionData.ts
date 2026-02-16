import { useState, useEffect } from "react";
import { Collection } from "@/app/types/objects";
import { CollectionDataPayload } from "@/app/types/payloads";

interface UseCollectionDataProps {
  collection: Collection | null;
  id: string | null;
}

export function useCollectionData({ collection, id }: UseCollectionDataProps) {
  const [collectionData, setCollectionData] =
    useState<CollectionDataPayload | null>(null);
  const [ascending, setAscending] = useState(true);
  const [sortOn, setSortOn] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [query, setQuery] = useState("");
  const [usingQuery, setUsingQuery] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Collection data endpoint not available on current backend
  const loadCollectionData = async () => {
    setLoadingData(false);
  };

  useEffect(() => {
    loadCollectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, ascending, sortOn, collection, id]);

  return {
    collectionData,
    setCollectionData,
    ascending,
    setAscending,
    sortOn,
    setSortOn,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    usingQuery,
    setUsingQuery,
    loadCollectionData,
    loadingData,
  };
}
