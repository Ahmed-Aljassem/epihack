/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Lazily load demo heat-relief resource markers the first time
each map toggle is enabled, then reuse the cached data across pages.
*/

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_HEAT_RELIEF_RESOURCES,
  RESOURCE_GROUP_ORDER,
  fetchResources,
} from "../data/heatReliefResources";

const resourceDataCache = new Map();
const resourcePromiseCache = new Map();

function loadResourceGroup(group) {
  if (resourceDataCache.has(group)) {
    return Promise.resolve(resourceDataCache.get(group));
  }

  if (!resourcePromiseCache.has(group)) {
    const request = fetchResources(group)
      .then((markers) => {
        resourceDataCache.set(group, markers);
        resourcePromiseCache.delete(group);
        return markers;
      })
      .catch((error) => {
        resourcePromiseCache.delete(group);
        throw error;
      });

    resourcePromiseCache.set(group, request);
  }

  return resourcePromiseCache.get(group);
}

function initialResourcesByGroup() {
  return RESOURCE_GROUP_ORDER.reduce((acc, group) => {
    acc[group] = resourceDataCache.get(group) || null;
    return acc;
  }, {});
}

export function useHeatReliefResources(enabledGroups = []) {
  const [resourcesByGroup, setResourcesByGroup] = useState(initialResourcesByGroup);
  const [loadingGroups, setLoadingGroups] = useState({});
  const [errorGroups, setErrorGroups] = useState({});
  const enabledKey = useMemo(
    () => [...enabledGroups].sort().join("|"),
    [enabledGroups],
  );

  useEffect(() => {
    let cancelled = false;

    enabledGroups.forEach((group) => {
      if (resourceDataCache.has(group)) {
        setResourcesByGroup((current) => (
          current[group] ? current : { ...current, [group]: resourceDataCache.get(group) }
        ));
        return;
      }

      setLoadingGroups((current) => ({ ...current, [group]: true }));

      loadResourceGroup(group)
        .then((markers) => {
          if (cancelled) return;
          setResourcesByGroup((current) => ({ ...current, [group]: markers }));
          setLoadingGroups((current) => ({ ...current, [group]: false }));
          setErrorGroups((current) => ({ ...current, [group]: null }));
        })
        .catch((error) => {
          if (cancelled) return;
          setLoadingGroups((current) => ({ ...current, [group]: false }));
          setErrorGroups((current) => ({ ...current, [group]: error }));
        });
    });

    return () => {
      cancelled = true;
    };
  }, [enabledGroups, enabledKey]);

  const markers = useMemo(() => {
    return enabledGroups.flatMap((group) => {
      return (resourcesByGroup[group] || []).map((marker) => ({
        ...marker,
        group,
      }));
    });
  }, [enabledGroups, resourcesByGroup]);

  const groupCounts = useMemo(() => {
    return RESOURCE_GROUP_ORDER.reduce((acc, group) => {
      acc[group] = (resourcesByGroup[group] || DEMO_HEAT_RELIEF_RESOURCES[group] || []).length;
      return acc;
    }, {});
  }, [resourcesByGroup]);

  return {
    markers,
    groupCounts,
    loadingGroups,
    errorGroups,
    totalEnabledCount: markers.length,
  };
}
