import * as AccordionComponents from 'fumadocs-ui/components/accordion';
import * as StepsComponents from 'fumadocs-ui/components/steps';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Showcase } from './components/showcase';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    ...AccordionComponents,
    ...StepsComponents,
    ...TabsComponents,
    TypeTable,
    Showcase,
  };
}
