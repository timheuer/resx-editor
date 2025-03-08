// This is an explicit replication of json2resx in very use-specific.
// ResX2Json was generating too many changes and the library is fairly stale
// Main changes:
// -- This preserves the extra space for self-closing tags
// -- If an empty comment from the JSON payload exists, don't add an empty <comment/> node causing too many diffs
import { create } from 'xmlbuilder2';

export function jsonToResx(json: Record<string, { value: string; comment?: string }>): string {
    const root = create({ version: '1.0', encoding: 'utf-8' })
        .ele('root')
        .com(`  
    Microsoft ResX Schema 
    
    Version 2.0
    
    The primary goals of this format is to allow a simple XML format 
    that is mostly human readable. The generation and parsing of the 
    various data types are done through the TypeConverter classes 
    associated with the data types.
    
    Example:
    
    ... ado.net/XML headers & schema ...
    <resheader name="resmimetype">text/microsoft-resx</resheader>
    <resheader name="version">2.0</resheader>
    <resheader name="reader">System.Resources.ResXResourceReader, System.Windows.Forms, ...</resheader>
    <resheader name="writer">System.Resources.ResXResourceWriter, System.Windows.Forms, ...</resheader>
    <data name="Name1"><value>this is my long string</value><comment>this is a comment</comment></data>
    <data name="Color1" type="System.Drawing.Color, System.Drawing">Blue</data>
    <data name="Bitmap1" mimetype="application/x-microsoft.net.object.binary.base64">
        <value>[base64 mime encoded serialized .NET Framework object]</value>
    </data>
    <data name="Icon1" type="System.Drawing.Icon, System.Drawing" mimetype="application/x-microsoft.net.object.bytearray.base64">
        <value>[base64 mime encoded string representing a byte array form of the .NET Framework object]</value>
        <comment>This is a comment</comment>
    </data>
                
    There are any number of "resheader" rows that contain simple 
    name/value pairs.
    
    Each data row contains a name, and value. The row also contains a 
    type or mimetype. Type corresponds to a .NET class that support 
    text/value conversion through the TypeConverter architecture. 
    Classes that don't support this are serialized and stored with the 
    mimetype set.
    
    The mimetype is used for serialized objects, and tells the 
    ResXResourceReader how to depersist the object. This is currently not 
    extensible. For a given mimetype the value must be set accordingly:
    
    Note - application/x-microsoft.net.object.binary.base64 is the format 
    that the ResXResourceWriter will generate, however the reader can 
    read any of the formats listed below.
    
    mimetype: application/x-microsoft.net.object.binary.base64
    value   : The object must be serialized with 
            : System.Runtime.Serialization.Formatters.Binary.BinaryFormatter
            : and then encoded with base64 encoding.
    
    mimetype: application/x-microsoft.net.object.soap.base64
    value   : The object must be serialized with 
            : System.Runtime.Serialization.Formatters.Soap.SoapFormatter
            : and then encoded with base64 encoding.

    mimetype: application/x-microsoft.net.object.bytearray.base64
    value   : The object must be serialized into a byte array 
            : using a System.ComponentModel.TypeConverter
            : and then encoded with base64 encoding.
    `);

    const schema = root.ele('xsd:schema', { id: 'root' })
        .att('xmlns', '')
        .att('xmlns:xsd', 'http://www.w3.org/2001/XMLSchema')
        .att('xmlns:msdata', 'urn:schemas-microsoft-com:xml-msdata')
        .ele('xsd:import', { namespace: 'http://www.w3.org/XML/1998/namespace' }).up()
        .ele('xsd:element', { name: 'root' })
        .att('msdata:IsDataSet', 'true')
        .ele('xsd:complexType')
        .ele('xsd:choice', { maxOccurs: 'unbounded' })
        // metadata element
        .ele('xsd:element', { name: 'metadata' })
        .ele('xsd:complexType')
        .ele('xsd:sequence')
        .ele('xsd:element', { name: 'value', type: 'xsd:string', minOccurs: '0' }).up()
        .up()
        .ele('xsd:attribute', { name: 'name', use: 'required', type: 'xsd:string' }).up()
        .ele('xsd:attribute', { name: 'type', type: 'xsd:string' }).up()
        .ele('xsd:attribute', { name: 'mimetype', type: 'xsd:string' }).up()
        .ele('xsd:attribute', { ref: 'xml:space' }).up()
        .up()
        .up()
        // assembly element
        .ele('xsd:element', { name: 'assembly' })
        .ele('xsd:complexType')
        .ele('xsd:attribute', { name: 'alias', type: 'xsd:string' }).up()
        .ele('xsd:attribute', { name: 'name', type: 'xsd:string' }).up()
        .up()
        .up()
        // data element
        .ele('xsd:element', { name: 'data' })
        .ele('xsd:complexType')
        .ele('xsd:sequence')
        .ele('xsd:element', { name: 'value', type: 'xsd:string', minOccurs: '0' })
        .att('msdata:Ordinal', '1')
        .up()
        .ele('xsd:element', { name: 'comment', type: 'xsd:string', minOccurs: '0' })
        .att('msdata:Ordinal', '2')
        .up()
        .up()
        .ele('xsd:attribute', { name: 'name', type: 'xsd:string', use: 'required' })
        .att('msdata:Ordinal', '1')
        .up()
        .ele('xsd:attribute', { name: 'type', type: 'xsd:string' })
        .att('msdata:Ordinal', '3')
        .up()
        .ele('xsd:attribute', { name: 'mimetype', type: 'xsd:string' })
        .att('msdata:Ordinal', '4')
        .up()
        .ele('xsd:attribute', { ref: 'xml:space' }).up()
        .up()
        .up()
        // resheader element
        .ele('xsd:element', { name: 'resheader' })
        .ele('xsd:complexType')
        .ele('xsd:sequence')
        .ele('xsd:element', { name: 'value', type: 'xsd:string', minOccurs: '0' })
        .att('msdata:Ordinal', '1')
        .up()
        .up()
        .ele('xsd:attribute', { name: 'name', type: 'xsd:string', use: 'required' }).up()
        .up()
        .up();

    // Add required resheaders
    root.ele('resheader', { name: 'resmimetype' })
        .ele('value').txt('text/microsoft-resx').up().up()
        .ele('resheader', { name: 'version' })
        .ele('value').txt('2.0').up().up()
        .ele('resheader', { name: 'reader' })
        .ele('value').txt('System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089').up().up()
        .ele('resheader', { name: 'writer' })
        .ele('value').txt('System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089').up().up();

    // Add the data elements
    Object.entries(json).forEach(([key, { value, comment }]) => {
        const dataElement = root.ele('data', { name: key }).att('xml:space', 'preserve').ele('value').txt(value).up();

        if (comment) {
            dataElement.ele('comment').txt(comment).up();
        }

        dataElement.up();
    });

    const doc = root.end({ prettyPrint: true });
    return doc.replace(/<(\w+)([^>]*)\/>/g, '<$1$2 />') + '\n'; // extra space for self-closing tags to save old format for diffs
}
