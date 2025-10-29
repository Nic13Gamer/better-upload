import * as AccordionComponents from 'fumadocs-ui/components/accordion';
import * as StepsComponents from 'fumadocs-ui/components/steps';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { PageSelect } from './components/page-select';
import { Showcase } from './components/showcase';
import { TypeTable } from './components/type-table';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    ...AccordionComponents,
    ...StepsComponents,
    ...TabsComponents,
    TypeTable,
    Showcase,
    PageSelect,
  };
}
