
export interface ModelResult {
    models: Model[];
}
export interface Model {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: Details;
}
export interface Details {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
}

export interface ChatMessageWithRoles {
    message: string,
    role: 'user' | 'assistant'
}

export async function GetModels(){

    const ollamaEndpoint=GetApiEndpoint();

    const GetModelsFullUrl=ollamaEndpoint+"/api/tags";
    try {


        const response=await fetch(GetModelsFullUrl,{
            method:"GET",
            headers:{
                "Content-Type":"application/json",
            },
        });
        const data=await response.json();
        return {data: data as ModelResult,error:false};
    }
    catch(e){
        console.error(e);
        return {data: null,error:true};
    }
}

export interface ChatMessageResponse {
    model: string;
    created_at: string;
    message: Message;
    done_reason: string;
    done: boolean;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}
interface Message {
    role: string;
    content: string;
}

const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });


export async function MakeChatRequest(temperature:number,modelName:string,chatMessages:ChatMessageWithRoles[],image:File|null){
    const ollamaEndpoint=GetApiEndpoint();
    const messages=chatMessages.map((chatMessage:ChatMessageWithRoles)=>{return {role:chatMessage.role,content:chatMessage.message}});
    const MakeChatRequestFullUrl=ollamaEndpoint+"/api/chat";
    try {
        const images:string[]=[]
        if(image){
            const base64Image=await toBase64(image);
            images.push(base64Image);
        }

        const response=await fetch(MakeChatRequestFullUrl,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({options:{temperature:temperature},model:modelName,stream:false,messages:[...messages],images:images}),
        });
        const data=await response.json();

        return {data: data as ChatMessageResponse,error:response.status!=200};

    }
    catch(e){
        console.error(e);
        return {data: null,error:true};
    }
}

export async function PullModel(modelName:string)
{
    const ollamaEndpoint=GetApiEndpoint();

    const PullModelFullUrl=ollamaEndpoint+"/api/pull";
    try {


        const data=await fetch(PullModelFullUrl,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({model:modelName,stream:false}),
        });
        return {data: data,error:false};

    }
    catch(e){
        return {data: e,error:true};
    }

}


export async function DeleteModel(modelName:string){
    const ollamaEndpoint=GetApiEndpoint();

    const DeleteModelFullUrl=ollamaEndpoint+"/api/delete";
    try {


        const data=await fetch(DeleteModelFullUrl,{
            method:"DELETE",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({name:modelName}),
        });
        return {data: data,error:false};

    }
    catch(e){
        return {data: e,error:true};
    }

}


function GetApiEndpoint(){
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL; // Ortam değişkenini al

    console.log(apiBaseUrl); // Değeri logla

    if (!apiBaseUrl) {
        return "http://localhost:11434"; // Varsayılan değer döndür
    }

    return apiBaseUrl;
}