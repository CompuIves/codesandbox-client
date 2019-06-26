import React from 'react';
import Tags from '../Tags';
import { Overlay, SandboxDescription } from '../SandboxCard/elements';
import {
  Border,
  TemplateTitle,
  TemplateSubTitle,
  MyTemplate,
} from './elements';
import { Sandbox } from '../../types';

interface Props {
  template?: {
    id: string;
    color: string;
    sandbox: Sandbox;
  };
  i: number;
  onClick?: () => void;
}
const BANNER = 'https://codesandbox.io/static/img/banner.png';
const CustomTemplate = ({ template, onClick, i }: Props) => {
  if (!template) {
    return (
      <MyTemplate key={i}>
        <img height="109px" alt="loading" src={BANNER} />
        <Border />
        <div>
          <TemplateTitle>Loading</TemplateTitle>
        </div>
      </MyTemplate>
    );
  }

  const sandbox = template.sandbox;
  const title = sandbox.title || sandbox.alias || sandbox.id;

  return (
    <MyTemplate key={i} onClick={onClick} overlayHeight={109}>
      <img height="109px" src={sandbox.screenshotUrl || BANNER} alt={title} />
      <Overlay>
        <SandboxDescription>{sandbox.description}</SandboxDescription>
        {sandbox.tags && <Tags tags={sandbox.tags} />}
      </Overlay>
      <Border color={template.color} />
      <div>
        <TemplateTitle>{title}</TemplateTitle>
        <TemplateSubTitle>{sandbox.description}</TemplateSubTitle>
      </div>
    </MyTemplate>
  );
};

export default CustomTemplate;
