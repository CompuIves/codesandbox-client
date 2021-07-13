import React, { useEffect } from 'react';
import {
  connectInfiniteHits,
  InfiniteHitsProvided
} from 'react-instantsearch-core';
import { AlgoliaSandboxHit } from '@codesandbox/common/lib/types/algolia';
import { ITemplateInfo } from '../../TemplateList';
import { DynamicWidthTemplateList } from '../../TemplateList/DynamicWidthTemplateList';

type ResultsProps = InfiniteHitsProvided<AlgoliaSandboxHit> & {};

const Results = (props: ResultsProps) => {
  const { hits } = props;
  const bottomDetectionEl = React.useRef<HTMLDivElement>();

  useEffect(() => {
    let observer: IntersectionObserver;
    const onSentinelIntersection = (entries: IntersectionObserverEntry[]) => {
      const { hasMore, refineNext } = props;

      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore) {
          refineNext();
        }
      });
    };

    if (bottomDetectionEl.current) {
      observer = new IntersectionObserver(onSentinelIntersection);
      observer.observe(bottomDetectionEl.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [props]);

  const searchTemplateInfo: ITemplateInfo = {
    key: 'search-results',
    templates: hits.map(hit => ({
      id: hit.custom_template.id,
      color: hit.custom_template.color,
      iconUrl: hit.custom_template.icon_url,
      published: hit.custom_template.published,
      sandbox: {
        id: hit.objectID,
        alias: hit.alias,
        title: hit.title,
        description: hit.description,
        insertedAt: new Date(hit.inserted_at).toString(),
        updatedAt: new Date(hit.updated_at).toString(),
        author: hit.author,
        source: {
          template: hit.template,
        },
        collection: {
          team: hit.team,
        },
      },
    })),
  };

  return (
    <>
      <DynamicWidthTemplateList templateInfos={[searchTemplateInfo]} />

      <div
        style={{ minHeight: 10, width: 1, backgroundColor: 'transparent' }}
        ref={bottomDetectionEl}
        id="bottom-detection-element"
      />
    </>
  );
};

export const ExploreResultList = connectInfiniteHits(Results);
