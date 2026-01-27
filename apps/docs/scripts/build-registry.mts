import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

const components = [
  {
    name: 'upload-button',
    title: 'Upload Button',
    dependencies: ['@better-upload/client', 'lucide-react'],
    registryDependencies: ['button'],
  },
  {
    name: 'upload-dropzone',
    title: 'Upload Dropzone',
    dependencies: ['@better-upload/client', 'lucide-react', 'react-dropzone'],
    registryDependencies: [],
  },
  {
    name: 'upload-progress',
    title: 'Upload Progress',
    dependencies: ['@better-upload/client', 'lucide-react'],
    registryDependencies: ['progress'],
  },
  {
    name: 'paste-upload-area',
    title: 'Paste Upload Area',
    dependencies: ['@better-upload/client'],
    registryDependencies: [],
  },
];

const REGISTRY_PATH = path.join(process.cwd(), 'public/r');

async function buildRegistry() {
  await rimraf(REGISTRY_PATH);

  if (!existsSync(REGISTRY_PATH)) {
    await fs.mkdir(REGISTRY_PATH, { recursive: true });
  }

  for (const component of components) {
    const code = await fs.readFile(
      path.join(process.cwd(), `components/templates/${component.name}.txt`),
      'utf-8'
    );

    const entry = {
      name: component.name,
      title: component.title,
      type: 'registry:ui',
      dependencies: component.dependencies,
      registryDependencies: component.registryDependencies,
      files: [
        {
          path: `ui/${component.name}.tsx`,
          type: 'registry:ui',
          content: code,
        },
      ],
    };

    await fs.writeFile(
      path.join(REGISTRY_PATH, `${component.name}.json`),
      JSON.stringify(entry),
      'utf-8'
    );
  }

  const registry = {
    name: 'better-upload',
    homepage: 'https://better-upload.com',
    items: components.map((c) => ({
      name: c.name,
      title: c.title,
      type: 'registry:ui',
      registryDependencies: c.registryDependencies,
      dependencies: c.dependencies,
      files: [
        {
          path: `ui/${c.name}.json`,
          type: 'registry:ui',
        },
      ],
    })),
  };

  await fs.writeFile(
    path.join(REGISTRY_PATH, 'registry.json'),
    JSON.stringify(registry),
    'utf-8'
  );
}

try {
  await buildRegistry();

  console.log('✅ Done!');
} catch (error) {
  console.log(error);
  process.exit(1);
}
