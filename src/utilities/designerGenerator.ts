import * as path from 'path';

export function generateDesignerCode(resxPath: string, resources: { [key: string]: { value: string; comment?: string } }, accessLevel: 'public' | 'internal' = 'public'): string {
    const fileName = path.basename(resxPath, '.resx');
    const namespaceName = fileName.includes('.') ? fileName.split('.')[0] : 'Resources';
    const className = fileName.includes('.') ? fileName.split('.')[1] : fileName;

    let code = `//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.42000
//
//     Changes to this file may cause incorrect behavior and will be lost if
//     the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace ${namespaceName} {
    using System;
    
    /// <summary>
    ///   A strongly-typed resource class, for looking up localized strings, etc.
    /// </summary>
    [global::System.CodeDom.Compiler.GeneratedCodeAttribute("VS Code RESX Editor", "1.0.0.0")]
    [global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
    [global::System.Runtime.CompilerServices.CompilerGeneratedAttribute()]
    ${accessLevel} class ${className} {
        
        private static global::System.Resources.ResourceManager resourceMan;
        
        private static global::System.Globalization.CultureInfo resourceCulture;
        
        [global::System.Diagnostics.CodeAnalysis.SuppressMessageAttribute("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
        internal ${className}() {
        }
        
        /// <summary>
        ///   Returns the cached ResourceManager instance used by this class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        ${accessLevel} static global::System.Resources.ResourceManager ResourceManager {
            get {
                if (object.ReferenceEquals(resourceMan, null)) {
                    global::System.Resources.ResourceManager temp = new global::System.Resources.ResourceManager("${namespaceName}.${className}", typeof(${className}).Assembly);
                    resourceMan = temp;
                }
                return resourceMan;
            }
        }
        
        /// <summary>
        ///   Overrides the current thread's CurrentUICulture property for all
        ///   resource lookups using this strongly typed resource class.
        /// </summary>
        [global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
        ${accessLevel} static global::System.Globalization.CultureInfo Culture {
            get {
                return resourceCulture;
            }
            set {
                resourceCulture = value;
            }
        }
        
`;

    // Generate a property for each resource
    for (const [key, resource] of Object.entries(resources)) {
        if (resource.comment) {
            code += `        /// <summary>\n`;
            code += `        ///   ${resource.comment}\n`;
            code += `        /// </summary>\n`;
        }
        code += `        ${accessLevel} static string ${key} {
            get {
                return ResourceManager.GetString("${key}", resourceCulture);
            }
        }
        
`;
    }

    code += `    }
}`;

    return code;
}