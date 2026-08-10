import React, { useState } from 'react';

interface CodeBlockProps {
    children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children }) => {
    const [buttonText, setButtonText] = useState('Copia');

    const handleCopy = () => {
        navigator.clipboard.writeText(children).then(() => {
            setButtonText('Copiato!');
            setTimeout(() => setButtonText('Copia'), 2000);
        });
    };

    return (
        <div className="relative group">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-favella-cyan/10 hover:bg-favella-cyan text-favella-cyan hover:text-favella-dark text-xs font-mono py-1 px-3 rounded border border-favella-cyan/20"
            >
                {buttonText}
            </button>
            <pre className="p-5 font-mono text-sm text-favella-text-primary whitespace-pre-wrap overflow-x-auto leading-relaxed">
                <code>{children}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;