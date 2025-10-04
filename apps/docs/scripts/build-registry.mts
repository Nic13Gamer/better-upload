import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

const components = [
  {
    name: 'upload-button',
    title: 'Upload Button',
    dependencies: ['better-upload', 'lucide-react'],
    registryDependencies: ['button'],
  },
  {
    name: 'upload-dropzone',
    title: 'Upload Dropzone',
    dependencies: ['better-upload', 'lucide-react', 'react-dropzone'],
    registryDependencies: [],
  },
  {
    name: 'upload-dropzone-progress',
    title: 'Upload Dropzone with Progress',
    dependencies: ['better-upload', 'lucide-react', 'react-dropzone'],
    registryDependencies: ['progress'],
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
      type: 'registry:component',
      dependencies: component.dependencies,
      registryDependencies: component.registryDependencies,
      files: [
        {
          path: `registry/better-upload/${component.name}.tsx`,
          type: 'registry:component',
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
      type: 'registry:component',
      registryDependencies: c.registryDependencies,
      dependencies: c.dependencies,
      files: [
        {
          path: `registry/better-upload/${c.name}.json`,
          type: 'registry:component',
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
