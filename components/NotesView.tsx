
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import type { Project, ObjectSet, Space, AnyObject, RelationConfig } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

// --- Sub-component for a single Project Card in the gallery ---
interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg shadow-md cursor-pointer
                  transition-all duration-500 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'
                  }`}
    >
      <img
        src={project.imageUrl}
        alt={project.title}
        className="w-full h-64 object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-300 ease-in-out group-hover:bg-opacity-40"></div>
      <div className="absolute bottom-0 left-0 p-6 w-full transform transition-all duration-300 ease-in-out translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
        <h3 className="text-white text-xl font-bold">{project.title}</h3>
        <p className="text-gray-200 text-sm">{project.description}</p>
      </div>
    </div>
  );
};


// --- Sub-component for the Project Gallery view ---
interface ProjectGalleryProps {
  projects: Project[];
  onSelectProject: (setId: string) => void;
}

const ProjectGallery: React.FC<ProjectGalleryProps> = ({ projects, onSelectProject }) => (
  <div>
    <header className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Project Hub</h1>
      <p className="text-text-secondary mt-2">A fluid gallery of your project notes and ideas.</p>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} onClick={() => onSelectProject(project.linkedSetId)} />
      ))}
    </div>
  </div>
);

// --- Sub-components for rendering the hierarchical table ---

const tagColorMap = new Map<string, { bg: string, text: string, darkBg: string, darkText: string }>();
const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900/50', darkText: 'dark:text-blue-300' },
    { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900/50', darkText: 'dark:text-green-300' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900/50', darkText: 'dark:text-yellow-300' },
    { bg: 'bg-purple-100', text: 'text-purple-800', darkBg: 'dark:bg-purple-900/50', darkText: 'dark:text-purple-300' },
    { bg: 'bg-pink-100', text: 'text-pink-800', darkBg: 'dark:bg-pink-900/50', darkText: 'dark:text-pink-300' },
    { bg: 'bg-red-100', text: 'text-red-800', darkBg: 'dark:bg-red-900/50', darkText: 'dark:text-red-300' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', darkBg: 'dark:bg-indigo-900/50', darkText: 'dark:text-indigo-300' },
];

const getTagColor = (tag: string) => {
    if (!tagColorMap.has(tag)) {
        const color = colors[tagColorMap.size % colors.length];
        tagColorMap.set(tag, color);
    }
    return tagColorMap.get(tag)!;
};

interface ObjectRowProps {
  obj: AnyObject;
  relations: RelationConfig[];
  level: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

const ObjectRow: React.FC<ObjectRowProps> = ({ obj, relations, level, isExpanded, onToggleExpand }) => {
  const hasChildren = obj.children && obj.children.length > 0;

  return (
    <Fragment>
      <tr className="hover:bg-ui-hover-background transition-colors duration-200">
        {/* Name Column with Indentation and Toggle */}
        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">
          <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <button onClick={() => onToggleExpand(obj.id)} className="mr-2 p-0.5 rounded-full hover:bg-border">
                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                  <ChevronRightIcon />
                </div>
              </button>
            ) : (
              <div className="w-6 mr-2"></div> // Placeholder for alignment
            )}
            <span>{obj.name}</span>
          </div>
        </td>

        {/* Other Relation Columns */}
        {relations.slice(1).map(rel => (
          <td key={`${obj.id}-${rel.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
            {Array.isArray(obj.relations[rel.key]) ? (
              <div className="flex flex-wrap gap-2">
                {(obj.relations[rel.key] as string[]).map(tag => {
                  const { bg, text, darkBg, darkText } = getTagColor(tag);
                  return (
                    <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${darkBg} ${darkText}`}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span>{String(obj.relations[rel.key] ?? '')}</span>
            )}
          </td>
        ))}
      </tr>
      
      {/* Render Children if Expanded */}
      {hasChildren && isExpanded && (
        obj.children!.map(child => (
          <ObjectRow
            key={child.id}
            obj={child}
            relations={relations}
            level={level + 1}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
          />
        ))
      )}
    </Fragment>
  );
};


interface ObjectSetDetailViewProps {
  objectSet: ObjectSet;
}

const ObjectSetDetailView: React.FC<ObjectSetDetailViewProps> = ({ objectSet }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const visibleObjects = useMemo(() => {
    const result: { obj: AnyObject; level: number }[] = [];
    const traverse = (objects: AnyObject[], level: number) => {
      objects.forEach(obj => {
        result.push({ obj, level });
        if (obj.children && expandedIds.has(obj.id)) {
          traverse(obj.children, level + 1);
        }
      });
    };
    traverse(objectSet.objects, 0);
    return result;
  }, [objectSet.objects, expandedIds]);

  return (
    <div className="overflow-x-auto bg-ui-background rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-ui-hover-background">
          <tr>
            {objectSet.relations.map(rel => (
              <th key={rel.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {rel.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-ui-background divide-y divide-border">
          {visibleObjects.map(({ obj, level }, index) => (
             <tr key={obj.id} className="hover:bg-ui-hover-background transition-colors duration-200 animate-fade-in-up" style={{ animationDelay: `${index * 20}ms` }}>
                {/* Name Column with Indentation and Toggle */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">
                  <div className="flex items-center">
                    <div style={{ width: `${level * 24}px` }} className="flex-shrink-0"></div>
                    {obj.children && obj.children.length > 0 ? (
                      <button onClick={() => handleToggleExpand(obj.id)} className="mr-2 p-0.5 rounded-full hover:bg-border flex-shrink-0">
                        <div className={`transition-transform duration-200 ${expandedIds.has(obj.id) ? 'rotate-90' : 'rotate-0'}`}>
                          <ChevronRightIcon />
                        </div>
                      </button>
                    ) : (
                      <div className="w-7 mr-2 flex-shrink-0"></div> // Placeholder for alignment
                    )}
                    <span>{obj.name}</span>
                  </div>
                </td>

                {/* Other Relation Columns */}
                {objectSet.relations.slice(1).map(rel => (
                  <td key={`${obj.id}-${rel.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                    {Array.isArray(obj.relations[rel.key]) ? (
                      <div className="flex flex-wrap gap-2">
                        {(obj.relations[rel.key] as string[]).map(tag => {
                          const { bg, text, darkBg, darkText } = getTagColor(tag);
                          return (
                            <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${darkBg} ${darkText}`}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span>{String(obj.relations[rel.key] ?? '')}</span>
                    )}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// --- Main NotesView Component ---
interface NotesViewProps {
  space: Space | null;
}

const NotesView: React.FC<NotesViewProps> = ({ space }) => {
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [isDetailViewVisible, setIsDetailViewVisible] = useState(false);

  // When the space changes, reset the view to the gallery.
  useEffect(() => {
    setActiveSetId(null);
    setIsDetailViewVisible(false);
  }, [space]);
  
  if (!space) {
    return <div className="text-center text-text-secondary">Select a Space to begin.</div>;
  }
  
  const activeSet = activeSetId ? space.sets.find(set => set.id === activeSetId) : null;

  const handleSelectProject = (setId: string) => {
    setActiveSetId(setId);
    requestAnimationFrame(() => {
      setIsDetailViewVisible(true);
    });
  };

  const handleBack = () => {
    setIsDetailViewVisible(false);
    setTimeout(() => {
      setActiveSetId(null);
    }, 500); // This duration must match the CSS `duration-500` class.
  };

  return (
    <div className="w-full relative">
      {/* Gallery View */}
      <div
        className={`transition-opacity duration-500 ease-in-out ${
          isDetailViewVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <ProjectGallery projects={space.projects} onSelectProject={handleSelectProject} />
      </div>

      {/* Detail View Container */}
      {activeSet && (
        <div
          className={`absolute top-0 left-0 w-full transition-opacity duration-500 ease-in-out ${
            isDetailViewVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <header className="mb-8">
            <button onClick={handleBack} className="flex items-center text-text-secondary hover:text-text-primary transition-colors duration-200 mb-4">
              <ArrowLeftIcon />
              <span className="ml-2 font-medium">Back to Hub</span>
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{activeSet.name}</h1>
            <p className="text-text-secondary mt-2">{activeSet.description}</p>
          </header>
          <ObjectSetDetailView objectSet={activeSet} />
        </div>
      )}
    </div>
  );
};

export default NotesView;