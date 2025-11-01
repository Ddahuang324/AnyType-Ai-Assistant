import React, { useState, useEffect } from 'react';
import type { Project, ObjectSet, Space } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

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
      <h1 className="text-4xl font-bold text-[#222222]">Project Hub</h1>
      <p className="text-gray-500 mt-2">A fluid gallery of your project notes and ideas.</p>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} onClick={() => onSelectProject(project.linkedSetId)} />
      ))}
    </div>
  </div>
);

// --- Sub-component for rendering the table of an Object Set ---
interface ObjectSetDetailViewProps {
  objectSet: ObjectSet;
}

const ObjectSetDetailView: React.FC<ObjectSetDetailViewProps> = ({ objectSet }) => {
    const tagColorMap = new Map<string, { bg: string, text: string }>();
    const colors = [
        { bg: 'bg-blue-100', text: 'text-blue-800' },
        { bg: 'bg-green-100', text: 'text-green-800' },
        { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        { bg: 'bg-purple-100', text: 'text-purple-800' },
        { bg: 'bg-pink-100', text: 'text-pink-800' },
        { bg: 'bg-red-100', text: 'text-red-800' },
        { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    ];

    const getTagColor = (tag: string) => {
        if (!tagColorMap.has(tag)) {
            const color = colors[tagColorMap.size % colors.length];
            tagColorMap.set(tag, color);
        }
        return tagColorMap.get(tag)!;
    };
    
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {objectSet.relations.map(rel => (
              <th key={rel.key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {rel.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {objectSet.objects.map((obj, index) => (
            <tr key={obj.id} className="hover:bg-gray-50 transition-colors duration-200 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{obj.name}</td>
              {objectSet.relations.slice(1).map(rel => (
                <td key={`${obj.id}-${rel.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Array.isArray(obj.relations[rel.key]) ? (
                    <div className="flex flex-wrap gap-2">
                      {(obj.relations[rel.key] as string[]).map(tag => {
                        const { bg, text } = getTagColor(tag);
                        return (
                          <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
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
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
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
    return <div className="text-center text-gray-500">Select a Space to begin.</div>;
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
            <button onClick={handleBack} className="flex items-center text-gray-500 hover:text-[#222222] transition-colors duration-200 mb-4">
              <ArrowLeftIcon />
              <span className="ml-2 font-medium">Back to Hub</span>
            </button>
            <h1 className="text-4xl font-bold text-[#222222]">{activeSet.name}</h1>
            <p className="text-gray-500 mt-2">{activeSet.description}</p>
          </header>
          <ObjectSetDetailView objectSet={activeSet} />
        </div>
      )}
    </div>
  );
};

export default NotesView;